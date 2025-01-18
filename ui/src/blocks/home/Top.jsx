import React from 'react'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { graphql, useStaticQuery } from 'gatsby'
import { AngleDoubleRight, ExclamationTriangle } from '@emotion-icons/fa-solid'
import { Box, Grid, Heading, Paragraph, Text } from 'theme-ui'

import { Link, OutboundLink } from 'components/Link'
import { summaryStats } from 'config'

const Top = () => {
  const images = useStaticQuery(graphql`
    query TopSectionQuery {
      speciesPhoto: file(relativePath: { eq: "28724644287_6710a192ed_o.jpg" }) {
        childImageSharp {
          gatsbyImageData(
            layout: FULL_WIDTH
            formats: [AUTO]
            placeholder: BLURRED
          )
        }
      }
      speciesScreenshot: file(relativePath: { eq: "explore_species.png" }) {
        childImageSharp {
          gatsbyImageData(
            width: 550
            layout: CONSTRAINED
            formats: [AUTO]
            placeholder: BLURRED
          )
        }
      }
      occurrenceScreenshot: file(
        relativePath: { eq: "explore_occurrences.png" }
      ) {
        childImageSharp {
          gatsbyImageData(
            width: 550
            layout: CONSTRAINED
            formats: [AUTO]
            placeholder: BLURRED
          )
        }
      }
    }
  `)

  return (
    <Box sx={{ py: '3rem' }}>
      <Box>
        <Paragraph>
          Throughout North America, bats are the primary predators of nocturnal
          flying insects, providing millions of dollars in pest control services
          annually. Bats occur in nearly every habitat on the continent, from
          high elevation alpine forests to deserts and neighborhoods within our
          largest cities.
          <br />
          <br />
          Because bats fly in the dark of night, it is challenging to understand
          their behaviors and monitor their population status.
          <br />
          <br />
          To get around this challenge, biologists use bat detectors to better
          understand bat ecology. These devices record the echolocation calls of
          nearby bats, and combined with specialized software and expert
          knowledge, biologists can often identify bat species from these
          detections. Biologists deploy these detectors for one or more nights
          at locations across the continent throughout the year, and may monitor
          presence or activity of various bat species each night.
        </Paragraph>
      </Box>

      <Heading as="h2" sx={{ mt: '4rem' }}>
        Bat Acoustic Monitoring Portal
      </Heading>
      <Paragraph>
        This application is a companion to the{' '}
        <OutboundLink to="https://batamp.databasin.org/" target="_blank">
          Bat Acoustic Monitoring Portal
        </OutboundLink>{' '}
        (BatAMP).
      </Paragraph>

      <Grid columns={[0, '1fr 2fr']} gap={4} sx={{ mt: '1.5rem' }}>
        <Box sx={{ mt: '0.5rem' }}>
          <GatsbyImage image={getImage(images.speciesPhoto)} alt="" />
        </Box>
        <Paragraph>
          BatAMP provides a central platform where biologists can upload their
          detection data in order to better understand the distribution,
          seasonal movement patterns, and population status of bats across North
          America. These data are then compiled for visualization within this
          tool.
          <br />
          <br />
          <OutboundLink to="https://batamp.databasin.org">
            Learn more about how to contribute data to BatAMP
          </OutboundLink>
          .
        </Paragraph>
      </Grid>

      <Heading as="h2" sx={{ mt: '5rem' }}>
        Bat Acoustic Monitoring Visualization Tool
      </Heading>
      <Paragraph>
        This application enables you to explore bat monitoring data for{' '}
        {summaryStats.speciesSurveyed} species across North America, allowing
        you to explore seasonal trends in species detections and explore bat
        activity for a particular location.
      </Paragraph>

      <Heading as="h3" sx={{ mt: '2rem' }}>
        <Link to="/species">
          <AngleDoubleRight size="1.25em" style={{ marginTop: '-4px' }} />{' '}
          Explore individual species
        </Link>
      </Heading>
      <Paragraph sx={{ mt: '0.5rem', mb: '0.5rem' }}>
        Explore detailed monitoring data for each of the species included in
        this application. Each species has a dedicated visualization page that
        enables you to:
      </Paragraph>

      <Box>
        <Grid columns={[0, '1fr 1fr']} gap={5} sx={{ mt: '1rem' }}>
          <Box as="ul" sx={{ mb: 0, color: 'grey.9', fontSize: 3 }}>
            <li>
              explore seasonal trends in activity or detections for different
              locations around North America.
            </li>
            <li>
              explore locations where the species has been detected compared to
              areas where the species was not detected.
            </li>
            <li>
              filter the data to explore trends for a given state or province as
              well as a given time period or season. You are able to combine
              multiple filters for season, year, state / province, and more.
            </li>
            <li>view detailed detection information for each bat detector.</li>
          </Box>

          <Box sx={{ img: { border: '1px solid', borderColor: 'grey.4' } }}>
            <GatsbyImage image={getImage(images.speciesScreenshot)} alt="" />
          </Box>
        </Grid>

        <Heading as="h3" sx={{ mt: '4rem' }}>
          <Link to="/presence">
            <AngleDoubleRight size="1.25em" style={{ marginTop: '-4px' }} />{' '}
            Explore species occurrences
          </Link>
        </Heading>
        <Paragraph sx={{ mt: '0.5rem', mb: '0.5rem' }}>
          Explore occurrence data aggregated across all species within this
          application. This allows you to:
        </Paragraph>
        <Grid columns={[0, '1fr 1fr']} gap={5} sx={{ mt: '1rem' }}>
          <Box as="ul" sx={{ mb: 0, color: 'grey.9', fontSize: 3 }}>
            <li>explore trends in species co-occurrence.</li>
            <li>
              see how many species have been detected at a given location based
              on sampling effort.
            </li>
            <li>
              filter the data to explore trends in co-occurrence for a given
              state or province as well as a given time period or season. You
              are able to combine multiple filters for season, year, state /
              province, and more.
            </li>
            <li>identify species mis-identification and information gaps.</li>
          </Box>
          <Box sx={{ img: { border: '1px solid', borderColor: 'grey.4' } }}>
            <GatsbyImage image={getImage(images.occurrenceScreenshot)} alt="" />
          </Box>
        </Grid>
      </Box>

      <Text variant="help" sx={{ mt: '2rem', fontSize: 2 }}>
        <ExclamationTriangle size="1em" style={{ marginRight: '0.5rem' }} />
        Note: due to the methods involved in identifying echolocation calls to
        species, some species may be mis-identified may be present in the data
        used by this application. You should be particularly cautious with
        detections that are well outside the known range for the species.
      </Text>
    </Box>
  )
}

export default Top
