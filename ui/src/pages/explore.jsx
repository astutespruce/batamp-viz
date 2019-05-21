import React from 'react'

import Layout from 'components/Layout'
import Map from 'components/Map'
import Sidebar from 'components/Sidebar'
import { Flex } from 'components/Grid'

import styled from 'style'

const Wrapper = styled(Flex)`
  height: 100%;
`

const ExplorePage = () => {
  return (
    <Layout title="Explore data">
      <Wrapper>
        <Sidebar>Under development...</Sidebar>
        <Map />
      </Wrapper>
    </Layout>
  )
}

export default ExplorePage
