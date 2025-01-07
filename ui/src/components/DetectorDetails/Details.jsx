import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading, Text } from 'theme-ui'
import { TimesCircle, ExclamationTriangle } from '@emotion-icons/fa-solid'

import { Tab, Tabs } from 'components/Tabs'
import { useCrossfilter } from 'components/Crossfilter'
import { MONTHS, SPECIES, METRIC_LABELS } from 'config'
import { formatNumber } from 'util/format'
import { sumBy, groupBy, filterObject } from 'util/data'
import TotalCharts from './TotalCharts'
import SeasonalityCharts from './SeasonalityCharts'

import DetectorMetadata from './DetectorMetadata'

const tabCSS = {
  flex: '1 1 auto',
  pt: '1rem',
  px: '1rem',
  pb: '2rem',
  overflowY: 'auto',
  overflowX: 'auto',
}

const Details = ({ detector, selectedSpecies, onClose }) => {
  const { state } = useCrossfilter()

  const { hasVisibleFilters } = state
  let { valueField } = state
  if (valueField === 'id' || valueField === 'species') {
    valueField = 'detectionNights'
  }

  const {
    name,
    detections,
    admin1Name,
    country,
    species,
    detectionNights,
    detectorNights,
    presenceOnly,
    dateRange,
    years,
    ts,
  } = detector

  // calculate totals by species, for non-zero species

  const bySpp = filterObject(sumBy(ts, 'species', valueField), (d) => d > 0)

  /* eslint-disable-next-line no-unused-vars */
  const sppTotals = Object.entries(bySpp).sort(([sppA, a], [sppB, b]) =>
    a < b ? 1 : -1
  )

  // If we are showing nights, we need to show the true effort which is
  // number of detector nights
  const max =
    valueField === 'detectionNights'
      ? detectorNights
      : Math.max(0, ...Object.values(bySpp))

  // create a map of species to array of monthly data, with an entry populated for each month
  const monthlyData =
    ts.length > 0
      ? Object.assign(
          ...Object.entries(groupBy(ts, 'species')).map(([spp, records]) => {
            const byMonth = sumBy(records, 'month', valueField)
            return { [spp]: MONTHS.map((month) => byMonth[month] || 0) }
          })
        )
      : []

  const seasonalityData = sppTotals.map(([spp]) => ({
    species: spp,
    ...SPECIES[spp],
    values: monthlyData[spp],
  }))

  const metric = METRIC_LABELS[valueField]

  const hasBats = detectionNights > 0
  const hasSpecies = species && species.length > 0

  let speciesWarning = null
  let presenceOnlyWarning = null

  if (presenceOnly && metric === 'detections') {
    presenceOnlyWarning = (
      <Box sx={{ color: 'highlight.5', mb: '2rem', fontSize: 1 }}>
        <ExclamationTriangle size="1.5em" />
        This detector monitored nightly occurrence instead of nightly activity.
        Only one detection was recorded per night for each species.
      </Box>
    )
  }

  if (!hasBats) {
    speciesWarning = (
      <Box sx={{ color: 'highlight.5', mb: '2rem' }}>
        <ExclamationTriangle size="1.5em" />
        No bats were detected on any night.
      </Box>
    )
  } else if (!hasSpecies) {
    speciesWarning = (
      <Box sx={{ color: 'highlight.5', mb: '2rem' }}>
        <ExclamationTriangle size="1.5em" />
        No species were detected on any night.
        <br />
        {detectionNights} bat detections were not identified to species.
      </Box>
    )
  }

  const filterNote = hasVisibleFilters ? (
    <Text variant="help" sx={{ mb: '1rem' }}>
      <ExclamationTriangle size="1.5em" />
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
              {name}
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
                <b>
                  {admin1Name}
                  {country ? `, ${country}` : null}
                </b>
              ) : null}
              <br />
              {dateRange}
            </Box>
            <Box sx={{ flex: '0 0 auto', textAlign: 'right' }}>
              <b>{formatNumber(detections, 0)}</b> species detections
              <br />
              <b>{formatNumber(detectorNights, 0)}</b> nights monitored
            </Box>
          </Flex>
        </Box>
      </Box>

      <Tabs sx={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <Tab id="species" label="Species Detected" sx={tabCSS}>
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
                Total {metric}
              </Heading>
              {presenceOnlyWarning}
              <TotalCharts
                data={sppTotals}
                selectedSpecies={selectedSpecies}
                max={max}
              />
            </>
          )}
        </Tab>
        <Tab sx={tabCSS} id="seasonality" label="Seasonality">
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
                {metric} by month
              </Heading>

              {years > 1 && (
                <Text variant="help" sx={{ mb: '1rem' }}>
                  Note: monthly data may include multiple years.
                </Text>
              )}

              {presenceOnlyWarning}

              <SeasonalityCharts
                data={seasonalityData}
                selectedSpecies={selectedSpecies}
              />
            </>
          )}
        </Tab>

        <Tab sx={tabCSS} id="overview" label="Detector Information">
          <DetectorMetadata {...detector} selectedSpecies={selectedSpecies} />
        </Tab>
      </Tabs>
    </Flex>
  )
}

Details.propTypes = {
  detector: PropTypes.shape({
    name: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    micHt: PropTypes.number.isRequired,
    detections: PropTypes.number.isRequired,
    contributors: PropTypes.string.isRequired,
    mfg: PropTypes.string,
    model: PropTypes.string,
    micType: PropTypes.string,
    reflType: PropTypes.string,
    idMethods: PropTypes.arrayOf(PropTypes.string),
    presenceOnly: PropTypes.number,
    datasets: PropTypes.arrayOf(PropTypes.string).isRequired,
    detectorNights: PropTypes.number.isRequired,
    detectionNights: PropTypes.number.isRequired,
    dateRange: PropTypes.string.isRequired,
    years: PropTypes.number.isRequired,
    admin1Name: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    species: PropTypes.arrayOf(PropTypes.string).isRequired,
    ts: PropTypes.arrayOf(
      PropTypes.shape({
        detections: PropTypes.number,
        detectionNights: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  selectedSpecies: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

Details.defaultProps = {
  selectedSpecies: null,
}

export default memo(Details)
