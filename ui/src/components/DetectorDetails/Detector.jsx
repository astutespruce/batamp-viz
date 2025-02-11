import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading, Text } from 'theme-ui'
import { TimesCircle, ExclamationTriangle } from '@emotion-icons/fa-solid'
import { escape, op } from 'arquero'

import { METRICS } from 'config'
import { Tab, Tabs } from 'components/Tabs'
import { useCrossfilter } from 'components/Crossfilter'
import { SpeciesTotalCharts, SpeciesMonthlyCharts } from 'components/Summary'
import { formatNumber, quantityLabel } from 'util/format'

import DetectorMetadata from './DetectorMetadata'

const Detector = ({ detector, speciesID, map, onClose }) => {
  const {
    state: {
      metric: { field: valueField, type: valueType },
      hasFilters,
    },
  } = useCrossfilter()

  // the only valid fields we summarize at this level are detections, detectionNights, or detectionRate
  const displayField =
    valueField === 'detectors' || valueField === 'speciesDetected'
      ? 'detectionNights'
      : valueField

  const metricLabel =
    displayField === 'detectionRate'
      ? '% of Nights With Detections'
      : `Total ${METRICS[displayField].label}`

  console.log('selected detector', detector)

  const {
    source,
    siteName,
    admin1Name,
    detectionNights,
    detectorNights,
    countType,
    dateRange,
    lat,
    lon,
    table,
  } = detector

  // calculate number of distinct years across all sites and detectors (used in header)
  const { detections, years } = table
    .rollup({ years: op.distinct('year') })
    .objects()[0]

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

  // aggregate to nested object of totals by month per species
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

  // If we are showing nights, we need to show the true effort which is
  // number of detector nights calculated for this detector in merge.py
  const max =
    displayField === 'detectionNights'
      ? detectorNights
      : Math.max(0, ...Object.values(sppTotals).map(({ total }) => total))

  const handleZoomTo = () => {
    if (map) {
      map.flyTo({ center: [lon, lat], zoom: 17 })
    }
  }

  // show warning if this is a presence-only detector and we're showing detections
  // (not needed for detectionNights because that isn't impacted by countType)
  const presenceOnlyWarning =
    countType === 'p' && displayField === 'detections' ? (
      <Text variant="help" sx={{ mb: '2rem', fontSize: 1 }}>
        Note: this detector monitored nightly occurrence instead of nightly
        activity; only one detection was recorded per night for each species.
      </Text>
    ) : null

  // show warning if there were no species detected on any night
  const speciesWarning =
    detections === 0 ? (
      <Box sx={{ color: 'highlight.5', mb: '2rem' }}>
        <ExclamationTriangle size="1.5em" />
        No species were detected on any night.
      </Box>
    ) : null

  // show warning if user applied filters to species or occurrences because
  // these filters are not applied to the detector-level data shown here
  const filterNote = hasFilters ? (
    <Text variant="help" sx={{ mb: '1rem' }}>
      <ExclamationTriangle
        size="1em"
        style={{ marginTop: '-3px', marginRight: '0.25em' }}
      />
      Note: your filters are NOT applied to the following data.
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
              {siteName.split(',').join(', ')}
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
        <Flex sx={{ justifyContent: 'space-between', fontSize: 1 }}>
          <Text sx={{ fontSize: 1, color: 'grey.8' }}>
            From:{' '}
            {source === 'nabat'
              ? 'North American Bat Monitoring Program (NABat)'
              : 'Bat Acoustic Monitoring Portal (BatAMP)'}
          </Text>
          <Text
            onClick={handleZoomTo}
            sx={{
              color: 'link',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            zoom to
          </Text>
        </Flex>

        <Box
          sx={{
            pt: '0.5rem',
            mt: '0.25rem',
            borderTop: '1px solid #FFF',
            color: 'grey.9',
            lineHeight: 1.5,
          }}
        >
          <Flex sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ flex: '1 1 auto' }}>
              {admin1Name ? (
                <>
                  <b>{admin1Name}</b>
                  <br />
                </>
              ) : null}
              {dateRange}
            </Box>
            <Box sx={{ flex: '0 0 auto', textAlign: 'right' }}>
              species detected on <b>{formatNumber(detectionNights, 0)}</b>{' '}
              {quantityLabel('nights', detectionNights)}
              <br />
              <b>{formatNumber(detectorNights, 0)}</b>{' '}
              {quantityLabel('nights', detectorNights)} monitored
            </Box>
          </Flex>
        </Box>
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
                type="detector"
                displayField={displayField}
                countType={countType}
                speciesID={speciesID}
                data={sppTotals}
                max={max}
                detectorNights={detectorNights}
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
                displayField={displayField}
                data={sppByMonth}
                speciesID={speciesID}
                valueType={valueType}
              />
            </>
          )}
        </Tab>
        <Tab id="overview" label="Detector Information">
          <DetectorMetadata
            {...detector}
            displayField={displayField}
            speciesTotals={sppTotals}
            speciesID={speciesID}
          />
        </Tab>
      </Tabs>
    </Flex>
  )
}

Detector.propTypes = {
  detector: PropTypes.shape({
    id: PropTypes.number.isRequired,
    source: PropTypes.string.isRequired,
    countType: PropTypes.string.isRequired,
    siteName: PropTypes.string.isRequired,
    lon: PropTypes.number.isRequired,
    lat: PropTypes.number.isRequired,
    detectorNights: PropTypes.number.isRequired,
    detectionNights: PropTypes.number.isRequired,
    dateRange: PropTypes.string.isRequired,
    admin1Name: PropTypes.string.isRequired,
    table: PropTypes.object.isRequired, // table filtered to this specific detector
    // other props validated by subcomponents
  }).isRequired,
  speciesID: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  map: PropTypes.object,
}

Detector.defaultProps = {
  speciesID: null,
  map: null,
}

export default memo(Detector)
