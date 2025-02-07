import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading, Text } from 'theme-ui'
import { TimesCircle, ExclamationTriangle } from '@emotion-icons/fa-solid'
import { escape, op } from 'arquero'

import { METRICS } from 'config'
import { Tab, Tabs } from 'components/Tabs'
import { useCrossfilter, filterTable } from 'components/Crossfilter'
import { SpeciesTotalCharts, SpeciesMonthlyCharts } from 'components/Summary'
import { groupBy } from 'util/data'
import { formatNumber, quantityLabel } from 'util/format'

import DetectorsList from './DetectorsList'

const HexDetails = ({
  id,
  level,
  table: unfilteredTable,
  detectorsTable: unfilteredDetectorsTable,
  map,
  speciesID,
  onClose,
}) => {
  const {
    state: {
      metric: { field: valueField, type: valueType },
      dimensions,
      filters,
      hasFilters,
    },
  } = useCrossfilter()

  let table = unfilteredTable
  let detectorsTable = unfilteredDetectorsTable

  // apply all active filters
  // show only detectors with sites that are visible on the map
  if (hasFilters) {
    table = filterTable({ table: unfilteredTable, dimensions, filters })

    const detIds = table
      .rollup({ detId: op.array_agg_distinct('detId') })
      .array('detId')[0]

    detectorsTable = detectorsTable.filter(
      escape((d) => op.includes(detIds, d.id))
    )
  }

  const showFilterWarning = unfilteredTable.size - table.size
  const hiddenDetectors = unfilteredDetectorsTable.size - detectorsTable.size

  // the only valid fields we summarize at this level are detections, detectionNights, or detectionRate
  const displayField =
    valueField === 'detectors' || valueField === 'speciesCount'
      ? 'detectionNights'
      : valueField

  const metricLabel =
    displayField === 'detectionRate'
      ? '% of Nights With Detections'
      : `Total ${METRICS[displayField].label}`

  // calculate number of distinct years across all sites and detectors (used in header)
  const { years } = table.rollup({ years: op.distinct('year') }).objects()[0]

  // calculate total detector nights and unique admin1 units (used in header)
  const {
    detectionNights: totalDetectionNights,
    detectorNights: totalDetectorNights,
    admin1Name,
  } = detectorsTable
    .rollup({
      detectionNights: op.sum('detectionNights'),
      detectorNights: op.sum('detectorNights'),
      admin1Name: op.array_agg_distinct('admin1Name'),
    })
    .objects()[0]

  // count number of presence-only detectors
  const presenceDetectors = detectorsTable.filter(
    (d) => d.countType === 'p'
  ).size

  // build list of detectors by source, sorted from oldest first year / month
  const detectorsBySource = groupBy(
    detectorsTable
      .join(
        table
          .derive({ ts: (d) => [d.year, d.month] })
          .groupby('detId')
          .rollup({ ts: op.min('ts') }),
        ['id', 'detId']
      )
      .orderby('source', 'ts')
      .objects(),
    'source'
  )

  // NOTE: we always sum detector nights
  const aggFuncs = { detectorNights: op.sum('detectorNights') }
  const deriveFunc = {}

  if (displayField === 'detectionRate') {
    aggFuncs.detectionNights = op.sum('detectionNights')
    // calculate detection rate as percent of detector nights with detections
    deriveFunc.total = escape(
      // prevent divide by 0
      (d) => (100 * d.detectionNights) / (d.detectorNights || 1)
    )
  } else {
    aggFuncs.total = op.sum(displayField)
  }

  // calculate total displayField and detector nights by species
  const sppTotals = Object.fromEntries(
    table
      .groupby('species')
      .rollup(aggFuncs)
      .derive(deriveFunc)
      .derive({ row: op.row_object('total', 'detectorNights') })
      .rollup({ entries: op.entries_agg('species', 'row') })
      .array('entries')[0]
  )

  // aggregate to nested object of totals of displayField and detectorNights by
  // month per species
  const sppByMonth = Object.fromEntries(
    table
      .groupby('species', 'month')
      .rollup(aggFuncs)
      .derive(deriveFunc)
      .groupby('species')
      .derive({ row: op.row_object('total', 'detectorNights') })
      .rollup({ monthEntries: op.entries_agg('month', 'row') })
      .derive({ byMonth: (d) => op.object(d.monthEntries) })
      .rollup({ entries: op.entries_agg('species', 'byMonth') })
      .array('entries')[0]
  )

  // because we're pooling together multiple detectors, we need to take the max
  // NOTE: this is different than for a single detector, where we use the
  // number of unique detector nights for that detector calculated in merge.py
  const max = Math.max(0, ...Object.values(sppTotals).map(({ total }) => total))

  // show warning if there are any presence-only detectors
  const presenceOnlyWarning =
    presenceDetectors > 0 && displayField === 'detections' ? (
      <Text variant="help" sx={{ mb: '2rem', fontSize: 1 }}>
        Note:{' '}
        {presenceDetectors === detectorsTable.size
          ? 'all'
          : formatNumber(presenceDetectors)}{' '}
        {quantityLabel('detectors', presenceDetectors)} in this area monitored
        nightly occurrence instead of nightly activity; only one detection was
        recorded per night for each species.
      </Text>
    ) : null

  // show warning if there were no species detected on any night
  const speciesWarning =
    totalDetectionNights === 0 ? (
      <Box sx={{ color: 'highlight.5', mb: '2rem' }}>
        <ExclamationTriangle size="1.5em" />
        No species were detected on any night.
      </Box>
    ) : null

  // show warning if user applied filters to species or occurrences because
  // these filters are pplied to the hex-level data shown here
  const filterNote = showFilterWarning ? (
    <Text variant="help" sx={{ mb: '1rem' }}>
      <ExclamationTriangle
        size="1em"
        style={{ marginTop: '-3px', marginRight: '0.25em' }}
      />
      Note: your filters are applied to the following data.
    </Text>
  ) : null

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: '0 0 auto',
          p: '1rem 1rem 0.5rem',
          bg: 'highlight.1',
          lineHeight: 1.2,
          borderBottom: '2px solid',
          borderBottomColor: 'grey.5',
        }}
      >
        <Flex sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ flex: '1 1 auto' }}>
            <Heading as="h1" sx={{ fontSize: '1.5rem', m: '0 0 0.25rem 0' }}>
              Selected area
              <Text
                sx={{
                  fontSize: 1,
                  display: 'inline',
                  color: 'grey.8',
                  ml: '0.5rem',
                  fontWeight: 'normal',
                }}
              >
                (hex {level.slice(-1)}:{id})
              </Text>
            </Heading>
          </Box>
          <Box
            onClick={onClose}
            sx={{
              flex: '0 0 auto',
              cursor: 'pointer',
              color: 'grey.6',
              '&:hover': {
                color: 'grey.9',
              },
            }}
          >
            <TimesCircle size="1.5em" />
          </Box>
        </Flex>

        <Flex
          sx={{
            pt: '0.5rem',
            mt: '0.25rem',
            borderTop: '1px solid #FFF',
            color: 'grey.9',
            lineHeight: 1.5,
            justifyContent: admin1Name ? 'space-between' : 'flex-end',
            gap: '1rem',
          }}
        >
          {admin1Name ? (
            <Box sx={{ flex: '1 1 auto' }}>
              <b>{admin1Name.join('; ')}</b>
            </Box>
          ) : null}
          <Box sx={{ flex: '0 0 auto' }}>
            <b>{formatNumber(detectorsTable.size, 0)}</b>{' '}
            {quantityLabel('detectors', detectorsTable.size)}
          </Box>
        </Flex>
      </Box>

      <Tabs sx={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <Tab id="species" label="Species Detected">
          {filterNote}

          {speciesWarning || (
            <>
              <Heading
                as="h3"
                sx={{
                  py: '0.25rem',
                  px: '1rem',
                  textAlign: 'center',
                  bg: 'grey.2',
                  mb: '0.5rem',
                  textTransform: 'capitalize',
                }}
              >
                {metricLabel}
              </Heading>

              {presenceOnlyWarning}

              <SpeciesTotalCharts
                type="hex"
                speciesID={speciesID}
                data={sppTotals}
                max={max}
              />
            </>
          )}
        </Tab>
        <Tab id="seasonality" label="Seasonality">
          {filterNote}
          {speciesWarning || (
            <>
              <Heading
                as="h3"
                sx={{
                  py: '0.25rem',
                  px: '1rem',
                  textAlign: 'center',
                  bg: 'grey.2',
                  mb: '0.5rem',
                  textTransform: 'capitalize',
                }}
              >
                {metricLabel}
              </Heading>

              {years > 1 && (
                <Text variant="help" sx={{ mb: '1rem' }}>
                  Note: monthly data may include multiple years.
                </Text>
              )}

              {presenceOnlyWarning}

              <SpeciesMonthlyCharts
                data={sppByMonth}
                speciesID={speciesID}
                valueType={valueType}
              />
            </>
          )}
        </Tab>
        <Tab id="detectors" label="Detectors">
          {hiddenDetectors ? (
            <Text variant="help" sx={{ mb: '1rem' }}>
              <ExclamationTriangle
                size="1em"
                style={{ marginTop: '-3px', marginRight: '0.25em' }}
              />
              Note: only the detectors that meet your filters are included
              below.
              <br /> {formatNumber(hiddenDetectors)}{' '}
              {quantityLabel('detectors', hiddenDetectors)} in this area{' '}
              {hiddenDetectors === 1 ? 'does' : 'do'} not meet your filters.
            </Text>
          ) : null}

          <DetectorsList detectors={detectorsBySource} map={map} />
        </Tab>
      </Tabs>
    </Flex>
  )
}

HexDetails.propTypes = {
  id: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
  table: PropTypes.object.isRequired, // table filtered to this specific hex
  detectorsTable: PropTypes.object.isRequired, // table filtered to this specific hex
  map: PropTypes.object.isRequired,
  speciesID: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

HexDetails.defaultProps = {
  speciesID: null,
}

export default HexDetails
