import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading } from 'theme-ui'
import { ExternalLinkAlt } from '@emotion-icons/fa-solid'

import { OutboundLink } from 'components/Link'
import { ExpandableParagraph } from 'components/Text'
import FiltersList from 'components/FiltersList'
import SmallThumbnail from 'components/Species/SmallThumbnail'
import { SPECIES, PROFILE_ROOT_URL } from 'config'

const resolveProfileId = (sciName) => sciName.toLowerCase().replace(' ', '-')

const SpeciesFilters = ({ speciesID, filters }) => {
  const { commonName, sciName, profileId, imageCredits } = SPECIES[speciesID]

  return (
    <Flex sx={{ flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: '0 0 auto', mt: '1rem', mx: '1rem', lineHeight: 1.2 }}>
        <Flex sx={{ gap: '0.5rem' }}>
          <Box>
            <SmallThumbnail speciesID={speciesID} />
            <Box sx={{ mt: '0.1rem', fontSize: '0.7rem', color: 'grey.6' }}>
              credit:{' '}
              {imageCredits || (
                <>
                  <OutboundLink to="https://www.merlintuttle.org">
                    MerlinTuttle.org
                  </OutboundLink>{' '}
                  | <OutboundLink to="http://www.batcon.org/">BCI</OutboundLink>
                </>
              )}
            </Box>
          </Box>
          <Box>
            <Heading as="h1" sx={{ fontSize: 5, m: 0, fontWeight: 'normal' }}>
              {commonName}
            </Heading>
            <Heading
              as="h3"
              sx={{
                m: 0,
                fontWeight: 'normal',
                fontStyle: 'italic',
                fontSize: 3,
              }}
            >
              {sciName}
            </Heading>
            <br />
            <OutboundLink
              sx={{ fontSize: 3 }}
              to={`${PROFILE_ROOT_URL}/${
                profileId || resolveProfileId(sciName)
              }`}
            >
              Species profile{' '}
              <ExternalLinkAlt size="1em" style={{ opacity: 0.6 }} />
            </OutboundLink>
          </Box>
        </Flex>
      </Box>

      <Box sx={{ mx: '1rem', mt: '1rem', mb: '0.5rem' }}>
        <ExpandableParagraph
          sx={{
            '& p': {
              fontSize: 2,
              color: 'grey.8',
              lineHeight: 1.3,
            },
          }}
          snippet="Use the filter charts below to select a subset of detectors. Detectors are
            also filtered by the extent of your map.  You can select..."
        >
          Use the filter charts below to select a subset of detectors. Detectors
          are also filtered by the extent of your map. You can select multiple
          values in each filter chart and combine multiple filters, such as
          selecting September and October in 2014 in California.
        </ExpandableParagraph>
      </Box>

      <FiltersList filters={filters} />
    </Flex>
  )
}

SpeciesFilters.propTypes = {
  speciesID: PropTypes.string.isRequired,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default SpeciesFilters
