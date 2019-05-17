import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from 'components/Layout'
import SEO from 'components/SEO'
import Map from 'components/Map'
import Sidebar from 'components/Sidebar'
import { Flex } from 'components/Grid'
import styled from 'style'

const Wrapper = styled(Flex)`
  height: 100%;
`

const SpeciesTemplate = ({
  data: {
    speciesJson: { species, commonName, sciName, detections, nights },
  },
}) => {
  return (
    <Layout>
      <SEO title={`${commonName} (${sciName})`} />
      <Wrapper>
        <Sidebar
        //   grid={grid}
        //   selectedFeature={selectedFeature}
        //   selectGrid={handleSetGrid}
        //   setLocation={handleSetLocation}
        />
        <Map
        //   grid={grid}
        //   location={location}
        //   onSelectFeature={handleSelectFeature}
        />
      </Wrapper>
    </Layout>
  )
}

SpeciesTemplate.propTypes = {}

export const pageQuery = graphql`
  query($id: String!) {
    speciesJson(id: { eq: $id }) {
      species
      commonName
      sciName
      detections
      nights
    }
  }
`

export default SpeciesTemplate
