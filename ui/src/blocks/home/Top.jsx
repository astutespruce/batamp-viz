import React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage as Img, getImage } from 'gatsby-plugin-image'
import { graphql, useStaticQuery } from 'gatsby'
import { FaExclamationTriangle } from 'react-icons/fa'

import { Link, OutboundLink } from 'components/Link'
import { Text, HelpText } from 'components/Text'
import { Columns, Column, Box } from 'components/Grid'

import styled, { themeGet } from 'style'
import { formatNumber } from 'util/format'
import { Section, Subtitle, Subheading } from './styles'

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
  color: ${themeGet('colors.grey.800')};
`

const ImgWrapper = styled.div`
  position: relative;
`

const Image = styled(Img)`
  border: 1px solid ${themeGet('colors.grey.500')};
`

const WarningIcon = styled(FaExclamationTriangle)`
  width: 1.5em;
  height: 1em;
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
  const images = useStaticQuery(graphql`
    query TopSectionQuery {
      speciesPhoto: file(relativePath: { eq: "28724644287_6710a192ed_o.jpg" }) {
        childImageSharp {
          gatsbyImageData(
            layout: FULL_WIDTH
            formats: [AUTO, WEBP]
            placeholder: BLURRED
          )
        }
      }
      speciesScreenshot: file(relativePath: { eq: "explore_species.jpg" }) {
        childImageSharp {
          gatsbyImageData(
            width: 550
            layout: CONSTRAINED
            formats: [AUTO, WEBP]
            placeholder: BLURRED
          )
        }
      }
      occurrenceScreenshot: file(
        relativePath: { eq: "explore_occurrences.jpg" }
      ) {
        childImageSharp {
          gatsbyImageData(
            width: 550
            layout: CONSTRAINED
            formats: [AUTO, WEBP]
            placeholder: BLURRED
          )
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
            To get around this challenge, biologists use bat detectors to better
            understand bat ecology. These devices record the echolocation calls
            of nearby bats, and combined with specialized software and expert
            knowledge, biologists can often identify bat species from these
            detections. Biologists deploy these detectors for one or more nights
            at locations across the continent throughout the year, and may
            monitor presence or activity of various bat species each night.
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
        <OutboundLink to="https://batamp.databasin.org/" target="_blank">
          Bat Acoustic Monitoring Portal
        </OutboundLink>{' '}
        (BatAMP).
      </p>

      <Columns>
        <NarrowColumn>
          <ImgWrapper>
            <Img image={getImage(images.speciesPhoto)} alt="" />
          </ImgWrapper>
        </NarrowColumn>
        <WideColumn>
          <p>
            BatAMP provides a central platform where biologists can upload their
            detection data in order to better understand the distribution,
            seasonal movement patterns, and population status of bats across
            North America. These data are then compiled for visualization within
            this tool.
            <br />
            <br />
            <OutboundLink to="https://batamp.databasin.org">
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
            This application enables you to explore bat monitoring data for{' '}
            {species} species across North America, allowing you to explore
            seasonal trends in species detections and explore bat activity for a
            particular location.
          </p>
        </Column>
        <Column />
      </Columns>

      <Subheading>
        <Link to="/species">Explore individual species</Link>
      </Subheading>
      <p style={{ marginBottom: '0.5rem' }}>
        Explore detailed monitoring data for each of the species included in
        this application. Each species has a dedicated visualization page that
        enables you to:
      </p>

      <Box>
        <Columns>
          <Column>
            <List>
              <li>
                explore seasonal trends in activity or detections for different
                locations around North America.
              </li>
              <li>
                explore locations where the species has been detected compared
                to areas where the species was not detected.
              </li>
              <li>
                filter the data to explore trends for a given state or province
                as well as a given time period or season. You are able to
                combine multiple filters for season, year, state / province, and
                more.
              </li>
              <li>
                view detailed detection information for each bat detector.
              </li>
            </List>
          </Column>

          <Column>
            <ImgWrapper>
              <Image image={getImage(images.speciesScreenshot)} alt="" />
            </ImgWrapper>
          </Column>
        </Columns>

        <Subheading mt="4rem">
          <Link to="/presence">Explore species occurrences</Link>
        </Subheading>
        <p style={{ marginBottom: '0.5rem' }}>
          Explore occurrence data aggregated across all species within this
          application. This allows you to:
        </p>
        <Columns>
          <Column>
            <List>
              <li>explore trends in species co-occurrence.</li>
              <li>
                see how many species have been detected at a given location
                based on sampling effort.
              </li>
              <li>
                explore which species are detected in particular regions simply
                by zooming the map to the area you are interested in.
              </li>
              <li>identify species mis-identification and information gaps.</li>
            </List>
          </Column>
          <Column>
            <ImgWrapper>
              <Image image={getImage(images.occurrenceScreenshot)} alt="" />
            </ImgWrapper>
          </Column>
        </Columns>
      </Box>

      <HelpText mt="2rem">
        <WarningIcon />
        Note: due to the methods involved in identifying echolocation calls to
        species, some species may be mis-identified may be present in the data
        used by this application. You should be particularly cautious with
        detections that are well outside the known range for the species.
      </HelpText>
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
