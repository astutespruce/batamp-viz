import React from 'react'
import PropTypes from 'prop-types'
import Img from 'gatsby-image'
import { graphql, useStaticQuery } from 'gatsby'

import { Credits } from 'components/Image'
import { OutboundLink } from 'components/Link'
import { Text } from 'components/Text'
import { CallToActionBox } from 'components/Layout'
import { Columns, Column, Box } from 'components/Grid'

import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { Section, Title } from './styles'

const Subtitle = styled(Title).attrs({ fontSize: ['1.5rem', '2rem'] })``

// mx: '2rem',
const HighlightBox = styled(Box).attrs({ mb: '3rem', p: '1rem' })`
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

const ImgWrapper = styled.div`
  position: relative;
`

const PlaceHolder = styled.div`
  padding: 4rem;
  border: 1px solid ${themeGet('colors.grey.600')};
  box-shadow: 1px 1px 3px ${themeGet('colors.grey.500')};
  margin: 1rem;
  background-color: ${themeGet('colors.grey.300')};
  text-align: center;
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
  const data = useStaticQuery(graphql`
    query TopSectionQuery {
      image: file(relativePath: { eq: "28724644287_6710a192ed_o.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 3200) {
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
    }
  `)

  return (
    <Section>
      <Columns>
        <WideColumn>
          <p>
            Throughout North America, bats are the primary predators of
            nocturnal flying insects, providing millions of dollars in pest
            control services annually. Bats occur in nearly every habitat on the
            continent, from high elevation alpine forests to deserts and
            neighborhoods within our largest cities.
            <br />
            <br />
            Because bats fly in the dark of night, it is challenging to
            understand their behaviors and monitor their population status.
            <br />
            <br />
            To get around this challenge, bat biologists use bat detectors to
            better understand bat ecology. These devices record the echolocation
            calls of nearby bats, and combined with specialized software and
            expert knowledge, biologists can often identify bat species from
            these detections. Biologists deploy these detectors for one or more
            nights at locations across the continent throughout the year, and
            may monitor presence or activity of various bat species each night.
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

      <Subtitle mt="2rem">Bat Acoustic Monitoring Portal</Subtitle>
      <p>
        This application is a companion to the{' '}
        <OutboundLink
          from="/"
          to="https://batamp.databasin.org/"
          target="_blank"
        >
          Bat Acoustic Monitoring Portal
        </OutboundLink>{' '}
        (BatAMP).
      </p>

      <Columns>
        <NarrowColumn>
          <ImgWrapper>
            <Img fluid={data.image.childImageSharp.fluid} alt="" />
            <Credits
              url="https://www.instagram.com/svaldvard/?hl=en"
              author="Hoary Bat, José G. Martínez-Fonseca"
            />
          </ImgWrapper>
        </NarrowColumn>
        <WideColumn>
          <p>
            BatAMP provides a central platform where biologists can upload their
            detection data, to help biologists better understand the
            distribution, seasonal movement patterns, and population status of
            bats across North America. These data are then compiled for
            visualization within this tool.
            <br />
            <br />
            <OutboundLink from="/" to="https://batamp.databasin.org">
              Learn more about how to contribute data to BatAMP
            </OutboundLink>
            .
          </p>
        </WideColumn>
      </Columns>

      <Subtitle mt="4rem">Bat Acoustic Monitoring Visualization Tool</Subtitle>
      <Columns>
        <Column>
          <p>
            This application enables you to explore bat monitoring data for
            several species across North America, allowing you to explore
            seasonal trends, ...
          </p>
        </Column>
        <Column />
      </Columns>

      {/* <Columns>
        <Column>
          <p>
            This application enables you to explore bat monitoring data for
            several species across North America, allowing you to explore
            seasonal trends, ...
          </p>
        </Column>
        <Column>
          <PlaceHolder>screenshot here</PlaceHolder>
        </Column>
      </Columns>

      <Columns>
        <Column>
          <p>You can also ...</p>
        </Column>
        <Column>
          <PlaceHolder>screenshot here</PlaceHolder>
        </Column>
      </Columns> */}
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
