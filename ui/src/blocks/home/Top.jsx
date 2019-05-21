import React from 'react'
import PropTypes from 'prop-types'

import { Text } from 'components/Text'
import { CallToActionBox } from 'components/Layout'
import { Columns, Column, Box } from 'components/Grid'
import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { Section } from './styles'

const HighlightBox = styled(Box).attrs({ my: '3rem', mx: '2rem', p: '1rem' })`
  background: ${themeGet('colors.highlight.100')};
  border-radius: 1rem;
`

const Top = ({ contributors, nights, years, admin1 }) => {
  return (
    <Section>
      <p>
        Bats provide ...
        <br />
        <br />
        To better understand the impacts of climate change, energy development,
        disease, and other factors that are impacting populations of bats across
        the continent, researchers have been collecting information about bats
        using acoustic detectors. These detectors are operated for one or more
        nights at a given location, and combined with specialized software and
        expert knowledge, researchers are able to ...
      </p>

      <HighlightBox>
        <Text textAlign="center" as="h2">
          Progress so far:
        </Text>
        <p>
          More than <b>{contributors}</b> contributors have collected and shared
          over <b>{formatNumber(nights)}</b> nights of data across{' '}
          <b>{years}</b> years and <b>{admin1}</b> states and provinces.
        </p>
      </HighlightBox>

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
  nights: PropTypes.number.isRequired,
  years: PropTypes.number.isRequired,
  contributors: PropTypes.number.isRequired,
}

export default Top
