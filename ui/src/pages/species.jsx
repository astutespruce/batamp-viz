import React, { useState } from 'react'

import Layout from 'components/Layout'
import SEO from 'components/SEO'
import { Flex } from 'components/Grid'

import styled from 'style'

const Wrapper = styled(Flex)`
  height: 100%;
`

const species = () => {
  const foo = 'bar'

  return (
    <Layout>
      <SEO title="Bat Species of North America" />
      <Wrapper>species list here</Wrapper>
    </Layout>
  )
}

export default species
