import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import { fromJS, Set } from 'immutable'

import { PrimaryButton as Button } from 'components/Button'
import Layout from 'components/Layout'
import { Switch } from 'components/Form'
import { Text, HelpText } from 'components/Text'
import { Context } from 'components/Crossfilter'
import Sidebar from 'components/Sidebar'
import { Box, Column, Columns, Flex } from 'components/Grid'
import FiltersList from 'components/FiltersList'
import styled, { themeGet } from 'style'

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


// const Stats = styled(Box).attrs({ mt: '0.5rem', pt: '0.5rem' })`
//   border-top: 1px solid #fff;
//   font-size: 0.9rem;
//   color: ${themeGet('colors.grey.900')};
//   line-height: 1.5;
// `

// const RightColumn = styled(Column)`
//   text-align: right;
// `

const index = ({
  filters,
  commonName,
  sciName,
  //   detectors,
  //   detections,
  //   nights,
  //   contributors,
}) => {
  // const {state, dispatch} = useContext(Context)

  return (
    <Wrapper>
      <Header>
        <Photo>photo</Photo>
        <div>
          <CommonName>{commonName}</CommonName>
          <ScientificName>{sciName}</ScientificName>
        </div>

        {/* <Stats>
                    <Columns>
                  <Column>
                    {formatNumber(detections, 0)} detections
                    <br />
                    {formatNumber(nights, 0)} nights
                  </Column>
                  <RightColumn>
                    {detectors} detectors
                    <br />
                    {contributors ? (
                      <>
                        {contributors}{' '}{quantityLabel('contributors', contributors)}
                      </>
                    ) : null}
                  </RightColumn>
                  </Columns>
                </Stats> */}
      </Header>

      {/* <Box m="1rem">
                  <Switch
                    label="filter detectors by map extent?"
                    enabled={filterByBounds}
                    onChange={handleToggleBoundsFilter}
                  />
                </Box> */}

      {/* <Box my="1rem">
                  <TimePlayer
                    timesteps={MONTHS}
                    timestepLabels={MONTH_LABELS}
                  />
                </Box> */}

        <Box m="1rem">
          <HelpText>
            Use the charts below to select a subset of detectors. Detectors are
            also filtered by the extent of your map.
          </HelpText>
        </Box>

        <FiltersList filters={filters} />
    </Wrapper>
  )
}

index.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
    })
  ).isRequired,
  commonName: PropTypes.string.isRequired,
  sciName: PropTypes.string.isRequired,
  //   detections: PropTypes.number.isRequired,
  //   nights: PropTypes.number.isRequired,
  //   detectors: PropTypes.number.isRequired,
  //   contributors: PropTypes.number.isRequired,
}

export default index
