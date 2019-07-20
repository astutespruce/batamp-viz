import React from 'react'
import PropTypes from 'prop-types'
import { FaExternalLinkAlt } from 'react-icons/fa'

import { OutboundLink } from 'components/Link'
import { Text, HelpText, ExpandableParagraph } from 'components/Text'
import { Box, Flex } from 'components/Grid'
import FiltersList from 'components/FiltersList'
import BaseThumbnail from 'components/Species/SmallThumbnail'
import styled, { themeGet } from 'style'
import {
  SPECIES,
  PROFILE_ROOT_URL,
  ECOS_ROOT_URL,
} from '../../../config/constants'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Header = styled(Box).attrs({ p: '0.5rem' })`
  line-height: 1.2;
  flex: 0;
`

const Thumbnail = styled(BaseThumbnail)`
  margin-right: 0.5rem;
`

const ImageCredits = styled.div`
  margin-top: 0.1rem;
  font-size: 0.6rem;
  color: ${themeGet('colors.grey.600')};
`

const CommonName = styled(Text).attrs({ as: 'h1' })`
  margin: 0;
  font-weight: normal;
`

const ScientificName = styled(Text).attrs({ as: 'h3' })`
  margin: 0;
  font-weight: normal;
  font-style: italic;
  color: ${themeGet('colors.grey.00')};
`

const ProfileLinkIcon = styled(FaExternalLinkAlt)`
  width: 1em;
  height: 0.8em;
  opacity: 0.6;
`

const ProfileLink = styled(OutboundLink)``

const index = ({ species, filters }) => {
  const { commonName, sciName, profileId, ecosId, imageCredits } = SPECIES[
    species
  ]

  return (
    <Wrapper>
      <Header>
        <Flex>
          <div>
            <Thumbnail species={species} />
            <ImageCredits>
              credit:
              {imageCredits || (
                <>
                  <OutboundLink
                    from="/species"
                    to="https://www.merlintuttle.org"
                  >
                    MerlinTuttle.org
                  </OutboundLink>{' '}
                  |{' '}
                  <OutboundLink from="/species" to="http://www.batcon.org/">
                    BCI
                  </OutboundLink>
                </>
              )}
            </ImageCredits>
          </div>
          <div>
            <CommonName>{commonName}</CommonName>
            <ScientificName>{sciName}</ScientificName>
            <br />
            {profileId && (
              <ProfileLink
                from="/species"
                to={`${PROFILE_ROOT_URL}/${profileId}`}
              >
                Species profile <ProfileLinkIcon />
              </ProfileLink>
            )}

            {ecosId && (
              <ProfileLink from="/species" to={`${ECOS_ROOT_URL}${ecosId}`}>
                Species profile <ProfileLinkIcon />
              </ProfileLink>
            )}
          </div>
        </Flex>
      </Header>

      <Box m="1rem">
        <HelpText>
          <ExpandableParagraph
            snippet="Use the filter charts below to select a subset of detectors. Detectors are
            also filtered by the extent of your map.  You can select..."
          >
            Use the filter charts below to select a subset of detectors.
            Detectors are also filtered by the extent of your map. You can
            select multiple values in each filter chart and combine multiple
            filters, such as selecting September and October in 2014 in
            California.
          </ExpandableParagraph>
        </HelpText>
      </Box>

      <FiltersList filters={filters} />
    </Wrapper>
  )
}

index.propTypes = {
  species: PropTypes.string.isRequired,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default index
