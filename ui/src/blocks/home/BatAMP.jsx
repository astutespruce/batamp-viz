import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Img from 'gatsby-image'

import { Credits } from 'components/Image'
import { Box, Columns, Column as BaseColumn } from 'components/Grid'
import { OutboundLink } from 'components/Link'
import { Link } from 'components/Link'
import styled, { themeGet } from 'style'
import { Section, Title } from './styles'

const Column = styled(BaseColumn).attrs({
  width: ['100%', '100%', '30%'],
})``

const WideColumn = styled(BaseColumn).attrs({
  width: ['100%', '100%', '60%'],
})``

const ImgWrapper = styled.div`
position: relative;
`

const BatAMP = () => {
  const data = useStaticQuery(graphql`
    query BackgroundSectionQuery {
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
      <Title>The Bat Acoustic Monitoring Portal</Title>
      <Columns>
        <Column>
        <ImgWrapper>
          <Img fluid={data.image.childImageSharp.fluid} alt="" />
          <Credits
            url="https://www.instagram.com/svaldvard/?hl=en"
            author="José G. Martínez-Fonseca"
          />
          </ImgWrapper>
        </Column>
        <WideColumn>
          <p>
            This application is a companion application to the{' '}
            <OutboundLink
              from="/"
              to="https://batamp.databasin.org/"
              target="_blank"
            >
              Bat Acoustic Monitoring Portal
            </OutboundLink>{' '}
            (BatAMP). BatAMP is a ...
          </p>
        </WideColumn>
      </Columns>
    </Section>
  )
}

export default BatAMP
