import React from 'react'
import PropTypes from 'prop-types'

import { Text, HelpText, ExpandableParagraph } from 'components/Text'
import { Box, Flex } from 'components/Grid'
import FiltersList from 'components/FiltersList'
import styled, { themeGet } from 'style'
import { SPECIES } from '../../../config/constants'

const Wrapper = styled(Flex).attrs({ flexDirection: 'column' })`
  height: 100%;
`

const Header = styled(Flex).attrs({ p: '0.5rem' })`
  background-color: ${themeGet('colors.highlight.100')};
  line-height: 1.2;
  flex: 0;
`

const Photo = styled.div`
  width: 4rem;
  height: 4rem;
  margin-right: 0.5rem;

  background-color: ${themeGet('colors.grey.100')};
  text-align: center;
  color: ${themeGet('colors.grey.600')};
  font-size: smaller;
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

const index = ({ species, filters }) => {
  const { commonName, sciName } = SPECIES[species]

  return (
    <Wrapper>
      <Header>
        <Photo>photo</Photo>
        <div>
          <CommonName>{commonName}</CommonName>
          <ScientificName>{sciName}</ScientificName>
        </div>
      </Header>

      {/* <Box my="1rem">
                  <TimePlayer
                    timesteps={MONTHS}
                    timestepLabels={MONTH_LABELS}
                  />
                </Box> */}

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
