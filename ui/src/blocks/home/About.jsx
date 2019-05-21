import React from 'react'

import { Box, Flex } from 'components/Grid'
import { Link } from 'components/Link'
import styled, { themeGet } from 'style'
// import CompareImg from 'images/compare.jpg'
// import ExploreImg from 'images/explore.jpg'
import { Section, Title } from './styles'

const Columns = styled(Flex).attrs({
  flexWrap: 'wrap',
  justifyContent: 'space-between',
})``

const Column = styled(Box).attrs({
  width: ['100%', '100%', '48%'],
})``

// const Screenshot = styled.img`
//   border: 1px solid ${themeGet('colors.grey.200')};
//   box-shadow: 1px 1px 3px ${themeGet('colors.grey.500')};
//   margin: 1rem;
// `

const PlaceHolder = styled.div`
  padding: 4rem;
  border: 1px solid ${themeGet('colors.grey.600')};
  box-shadow: 1px 1px 3px ${themeGet('colors.grey.500')};
  margin: 1rem;
  background-color: ${themeGet('colors.grey.300')};
  text-align: center;
`

const About = () => (
  <Section>
    <Title>The North American Bat Acoustic Monitoring Explorer</Title>
    <Columns>
      <Column>
        <p>
          This application enables you to explore bat monitoring data for
          several species across North America, allowing you to explore seasonal
          trends, ...
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
    </Columns>
  </Section>
)

export default About
