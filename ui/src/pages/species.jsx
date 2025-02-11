import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'
import * as aq from 'arquero'
import { Container, Heading } from 'theme-ui'

import { Layout, SEO } from 'components/Layout'
import { SubpageHeaderImage as HeaderImage } from 'components/Image'
import { SpeciesList } from 'components/SpeciesList'
import { summaryStats, SPECIES } from 'config'

const SpeciesListPage = ({ data: { headerImage } }) => {
  const speciesTable = aq
    .table(summaryStats.speciesTable)
    .rename({ species: 'speciesID' })
    .join(
      aq.from(
        Object.entries(SPECIES).map(
          ([speciesID, { sciName, commonName, ...rest }]) => ({
            speciesID,
            sciName,
            commonName,
            searchKey: `${speciesID} ${commonName.toLowerCase()} ${sciName.toLowerCase()}`,
            ...rest,
          })
        )
      ),
      'speciesID'
    )

  return (
    <Layout>
      <HeaderImage
        image={headerImage}
        height="40vh"
        minHeight="23rem"
        position="bottom"
        credits={{
          author:
            'Fringed Myotis (Myotis thysanodes) by José G. Martínez-Fonseca',
        }}
      />
      <Container py="2rem">
        <Heading as="h1" sx={{ fontSize: '3rem', mb: '3rem', lineHeight: 1.2 }}>
          Explore Data for North American Bat Species
        </Heading>
        <SpeciesList speciesTable={speciesTable} />
      </Container>
    </Layout>
  )
}

SpeciesListPage.propTypes = {
  data: PropTypes.shape({
    headerImage: PropTypes.object.isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query {
    headerImage: file(relativePath: { eq: "NK1_6328.jpg" }) {
      childImageSharp {
        gatsbyImageData(
          layout: FULL_WIDTH
          formats: [AUTO]
          placeholder: BLURRED
        )
      }
    }
  }
`

export default SpeciesListPage

export const Head = () => <SEO title="Explore Bat Species" />
