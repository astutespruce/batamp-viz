import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading, Text } from 'theme-ui'
import { TimesCircle, ExclamationTriangle } from '@emotion-icons/fa-solid'
import { op } from 'arquero'

import { METRIC_LABELS } from 'config'
import { Tab, Tabs } from 'components/Tabs'
import { useCrossfilter } from 'components/Crossfilter'
import { SpeciesTotalCharts, SpeciesMonthlyCharts } from 'components/Summary'
import { formatNumber, quantityLabel } from 'util/format'

import DetectorMetadata from './DetectorMetadata'

const Detector = ({ detector, speciesID, map, onClose }) => {
  const {
    state: {
      metric: { field: valueField },
      hasFilters,
    },
  } = useCrossfilter()

  const displayField =
    valueField === 'detectors' || valueField === 'speciesCount'
      ? 'detectionNights'
      : valueField
  const metricLabel = METRIC_LABELS[displayField]

  console.log('selected detector', detector)

  const {
    source,
    siteName,
    admin1Name,
    detectorNights,
    countType,
    dateRange,
    lat,
    lon,
    table,
  } = detector

  const handleZoomTo = () => {
    if (map) {
      map.flyTo({ center: [lon, lat], zoom: 17 })
    }
  }

  const { detections, years } = table
    .rollup({
      detections: op.sum('detections'),
      years: op.distinct('year'),
    })
    .objects()[0]

  // calculate total displayField and detector nights by species
  const sppTotals = Object.fromEntries(
    table
      .groupby('species')
      .rollup({
        [displayField]: op.sum(displayField),
        detectorNights: op.sum('detectorNights'),
      })
      .derive({ row: op.row_object(displayField, 'detectorNights') })
      .rollup({ entries: op.entries_agg('species', 'row') })
      .array('entries')[0]
  )

  // aggregate to nested object of totals by month per species
  const sppByMonth = Object.fromEntries(
    table
      .groupby('species', 'month')
      .rollup({
        [displayField]: op.sum(displayField),
        detectorNights: op.sum('detectorNights'),
      })
      .groupby('species')
      .derive({ row: op.row_object(displayField, 'detectorNights') })
      .rollup({ monthEntries: op.entries_agg('month', 'row') })
      .derive({ byMonth: (d) => op.object(d.monthEntries) })
      .rollup({ entries: op.entries_agg('species', 'byMonth') })
      .array('entries')[0]
  )

  // If we are showing nights, we need to show the true effort which is
  // number of detector nights
  const max =
    displayField === 'detectionNights'
      ? detectorNights
      : Math.max(
          0,
          ...Object.values(sppTotals).map(({ [displayField]: total }) => total)
        )

  const presenceOnlyWarning =
    countType === 'p' && displayField === 'detections' ? (
      <Text variant="help" sx={{ mb: '2rem', fontSize: 1 }}>
        Note: this detector monitored nightly occurrence instead of nightly
        activity; only one detection was recorded per night for each species.
      </Text>
    ) : null

  const speciesWarning =
    table.size === 0 ? (
      <Box sx={{ color: 'highlight.5', mb: '2rem' }}>
        <ExclamationTriangle size="1.5em" />
        No species were detected on any night.
      </Box>
    ) : null

  const filterNote = hasFilters ? (
    <Text variant="help" sx={{ mb: '1rem' }}>
      <ExclamationTriangle
        size="1em"
        style={{ marginTop: '-3px', marginRight: '0.25em' }}
      />
      Note: your filters are not applied to the following data.
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
              <b>{formatNumber(detections, 0)}</b> species{' '}
              {quantityLabel('detections', detections)}
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
                Total {metricLabel}
              </Heading>
              {presenceOnlyWarning}
              <SpeciesTotalCharts
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
                {metricLabel} by month
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
