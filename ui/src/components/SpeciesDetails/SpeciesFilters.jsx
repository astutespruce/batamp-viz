import React from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Heading } from 'theme-ui'
import { ExternalLinkAlt } from '@emotion-icons/fa-solid'

import { OutboundLink } from 'components/Link'
import { ExpandableParagraph } from 'components/Text'
import FiltersList from 'components/FiltersList'
import { SPECIES, PROFILE_ROOT_URL } from 'config'

const resolveProfileId = (sciName) => sciName.toLowerCase().replace(' ', '-')

const SpeciesFilters = ({ speciesID, filters }) => {
  const { commonName, sciName, profileId } = SPECIES[speciesID]

  return (
    <Flex sx={{ flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          flex: '0 0 auto',
          px: '1rem',
          py: '0.75rem',
          lineHeight: 1.2,
        }}
      >
        <Box>
          <Heading as="h1" sx={{ fontSize: 5, m: 0, lineHeight: 1.2 }}>
            {commonName}
          </Heading>
          <Flex
            sx={{
              gap: '1rem',
            }}
          >
            <Heading
              as="h3"
              sx={{
                m: 0,
                fontWeight: 'normal',
                fontStyle: 'italic',
                fontSize: 3,
                lineHeight: 1.2,
              }}
            >
              {sciName}
            </Heading>
            <Box>
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
      </Box>

      <Box sx={{ mx: '1rem', mb: '0.5rem' }}>
        <ExpandableParagraph
          sx={{
            '& p': {
              fontSize: 1,
              color: 'grey.8',
              lineHeight: 1.3,
            },
          }}
          snippet="Use the filter charts below to select a subset of detectors.  You can select multiple values in each filter chart..."
        >
          Use the filter charts below to select a subset of detectors. You can
          select multiple values in each filter chart and combine multiple
          filters, such as selecting September and October in 2014 in
          California.
        </ExpandableParagraph>
      </Box>

      <FiltersList filters={filters} speciesID={speciesID} />
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
