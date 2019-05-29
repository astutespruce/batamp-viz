import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Img from 'gatsby-image'

import { Credits } from 'components/Image'
import { Columns, Column as BaseColumn } from 'components/Grid'
import { OutboundLink } from 'components/Link'
import styled from 'style'
import { Section, Title } from './styles'

const Column = styled(BaseColumn).attrs({
  width: ['100%', '50%', '50%'],
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
              author="Hoary Bat, José G. Martínez-Fonseca"
            />
          </ImgWrapper>
        </Column>
        <Column>
          <p>
            This application is a companion to the{' '}
            <OutboundLink
              from="/"
              to="https://batamp.databasin.org/"
              target="_blank"
            >
              Bat Acoustic Monitoring Portal
            </OutboundLink>{' '}
            (BatAMP). BatAMP is a ...
          </p>
        </Column>
      </Columns>
    </Section>
  )
}

export default BatAMP
