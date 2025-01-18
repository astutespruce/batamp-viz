import React from 'react'
import { Box, Container, Flex, Grid, Text } from 'theme-ui'

import { summaryStats } from 'config'
import { formatNumber } from 'util/format'

const SummaryStats = () => {
  const {
    detectors,
    contributors,
    sppDetections,
    detectorNights,
    species,
    speciesSurveyed,
    years,
    admin1,
  } = summaryStats
  return (
    <Box
      sx={{
        my: 0,
        borderBottom: '2px solid',
        borderBottomColor: 'primary.5',
        bg: 'primary.1',
      }}
    >
      <Container sx={{ my: 0, p: 0 }}>
        <Grid
          columns={3}
          gap={0}
          sx={{
            fontSize: 3,
            py: '0.5rem',
            '&>div': {
              py: '0.5rem',
            },
            '&>div+div': {
              ml: '0.5rem',
              borderLeft: '1px solid #FFF',
              pl: '2rem',
            },
          }}
        >
          <Box>
            <Flex
              sx={{ alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}
            >
              <Text sx={{ fontSize: 5, fontWeight: 'bold', display: 'inline' }}>
                {formatNumber(sppDetections, 0)}
              </Text>
              <Text sx={{ display: 'inline' }}>detections</Text>
            </Flex>
            of <b>{species}</b> species out of <b>{speciesSurveyed}</b> surveyed
          </Box>
          <Box>
            <Flex
              sx={{ alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}
            >
              <Text sx={{ fontSize: 5, fontWeight: 'bold', display: 'inline' }}>
                {formatNumber(detectorNights, 0)}
              </Text>
              <Text sx={{ display: 'inline' }}>nights</Text>
            </Flex>
            monitored during <b>{years.length}</b> years
          </Box>
          <Box>
            <Flex
              sx={{ alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}
            >
              <Text sx={{ fontSize: 5, fontWeight: 'bold', display: 'inline' }}>
                {formatNumber(detectors, 0)}
              </Text>
              <Text sx={{ display: 'inline' }}>detectors</Text>
            </Flex>
            operated by <b>{contributors}</b> contributors across{' '}
            <b>{admin1.length}</b> states and provinces
          </Box>
        </Grid>
      </Container>
    </Box>
  )
}

export default SummaryStats
