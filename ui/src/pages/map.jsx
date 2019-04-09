import React, { useState } from 'react'

import Layout from 'components/Layout'
import SEO from 'components/SEO'
import Map from 'components/Map'
import Sidebar from 'components/Sidebar'
import { Flex } from 'components/Grid'

import styled from 'util/style'

const Wrapper = styled(Flex)`
  height: 100%;
`

const MapPage = () => {
  const [grid, setGrid] = useState(null)
  const [location, setLocation] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState(null)

  console.log('map page render', grid)

  const handleSetGrid = id => {
    if (id === grid) return // no-op
    setGrid(id)
    setSelectedFeature(null)
  }

  const handleSetLocation = newLocation => {
    setLocation(newLocation)
  }

  const handleSelectFeature = feature => {
    setSelectedFeature(feature)
  }

  return (
    <Layout>
      <SEO title="Home" />
      <Wrapper>
        <Sidebar
          grid={grid}
          selectedFeature={selectedFeature}
          selectGrid={handleSetGrid}
          setLocation={handleSetLocation}
        />
        <Map
          grid={grid}
          location={location}
          onSelectFeature={handleSelectFeature}
        />
      </Wrapper>
    </Layout>
  )
}

export default MapPage
