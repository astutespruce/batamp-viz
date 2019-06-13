import React from 'react'
import PropTypes from 'prop-types'

import { Text } from 'components/Text'
import { CallToActionBox } from 'components/Layout'
import { Columns, Column, Box } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { Section } from './styles'

// mx: '2rem',
const HighlightBox = styled(Box).attrs({ my: '3rem', p: '1rem' })`
  background: ${themeGet('colors.highlight.100')};
  border-radius: 1rem;
`

const HighlightTitle = styled(Text).attrs({ as: 'h3' })`
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #fff;
  text-align: center;
`

const WideColumn = styled(Column).attrs({
  width: ['100%', '100%', '66%'],
})``

const NarrowColumn = styled(Column).attrs({
  width: ['100%', '100%', '33%'],
})``

const List = styled.ul`
  margin-bottom: 0;
`

const Top = ({
  detectors,
  contributors,
  allDetections,
  sppDetections,
  detectorNights,
  species,
  years,
  admin1,
}) => {
  return (
    <Section>
      <Columns>
        <WideColumn>
          <p>
            Bats provide ...
            <br />
            <br />
            To better understand the impacts of climate change, energy
            development, disease, and other factors that are impacting
            populations of bats across the continent, researchers have been
            collecting information about bats using acoustic detectors. These
            detectors are operated for one or more nights at a given location,
            and combined with specialized software and expert knowledge,
            researchers are able to ...
          </p>
        </WideColumn>

        <NarrowColumn>
          <HighlightBox>
            <HighlightTitle>Progress so far:</HighlightTitle>
            <List>
              <li>
                <b>{formatNumber(allDetections, 0)}</b> total bat detections
              </li>
              <li>
                <b>{formatNumber(sppDetections, 0)}</b> detections of{' '}
                <b>{species}</b> species
              </li>
              <li>
                <b>{formatNumber(detectorNights, 0)}</b> nights monitored during{' '}
                <b>{years}</b> years
              </li>
              <li>
                <b>{formatNumber(detectors, 0)}</b> detectors operated by{' '}
                <b>{contributors}</b> contributors across <b>{admin1}</b> states
                and provinces
              </li>
            </List>
          </HighlightBox>
        </NarrowColumn>
      </Columns>

      <p>
        <br />
        Get started now exploring these data or select a species of interest...
      </p>

      <Columns my={['2rem']}>
        <Column>
          <CallToActionBox
            title="Explore Data"
            link="/explore"
            linkLabel="Start exploring"
          >
            TODO...
          </CallToActionBox>
        </Column>
        <Column>
          <CallToActionBox
            title="Explore Species"
            link="/species"
            linkLabel="Find your species"
          >
            TODO...
          </CallToActionBox>
        </Column>
      </Columns>
    </Section>
  )
}

Top.propTypes = {
  admin1: PropTypes.number.isRequired,
  detectors: PropTypes.number.isRequired,
  allDetections: PropTypes.number.isRequired,
  sppDetections: PropTypes.number.isRequired,
  detectorNights: PropTypes.number.isRequired,
  species: PropTypes.number.isRequired,
  years: PropTypes.number.isRequired,
  contributors: PropTypes.number.isRequired,
}

export default Top
