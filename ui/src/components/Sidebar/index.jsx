import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { css } from 'styled-components'

import { Box, Flex } from 'components/Grid'
import { Button, ButtonGroup } from 'components/Button'
import styled, { themeGet } from 'util/style'
import { formatNumber } from 'util/format'

const Wrapper = styled.div`
  flex: 0 0 auto;
  width: 400px;
  border-right: 1px solid ${themeGet('colors.grey.800')};
  padding: 1rem;
`

const Step = styled.div`
  flex: 0 0 auto;
  height: 2rem;
  width: 2rem;
  text-align: center;
  line-height: 1.4;
  margin-right: 0.5rem;
  border-radius: 4rem;
  background: ${themeGet('colors.grey.700')};
  color: #fff;
`

const Section = styled.section`
  &:not(:first-of-type) {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid ${themeGet('colors.grey.200')};
  }
`

const ResultsSection = styled(Section)`
  padding: 1rem !important;
  background-color: ${themeGet('colors.primary.100')};
  border-radius: 1rem;
  border: 1px solid ${themeGet('colors.primary.200')} !important;
`

const SectionHeader = styled(Flex).attrs({ alignItems: 'center' })`
  font-size: 1.3rem;
  font-weight: bold;
  line-height: 1.1;
`

const StyledButtonGroup = styled(ButtonGroup)`
  margin-top: 1rem;
`

const Row = styled(Flex).attrs({ justifyContent: 'space-between' })`
  border-bottom: 1px solid ${themeGet('colors.white')};
  padding: 0.25em 1em;
`

const HelpText = styled.p`
  color: ${themeGet('colors.grey.400')};
  font-size: smaller;
  font-style: italic;
`

const Label = styled.span`
color: ${themeGet('colors.grey.700')};
margin-right
`

const Value = styled.div``

const FieldHeader = styled.h4`
  margin-bottom: 0.5em;
  text-align: center;
`

const Input = styled.input.attrs({
  type: 'number',
})`
  padding: 0.25em 0.5em;
  outline: none;
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${themeGet('colors.primary.200')};
  transition: border-color 0.25s linear;
  &:focus {
    border-color: ${themeGet('colors.primary.600')};
  }

  ${({ invalid }) =>
    invalid &&
    css`
      border-color: ${themeGet('colors.secondary.500')} !important;
      background-color: ${themeGet('colors.secondary.200')};
    `}
`

const Sidebar = ({
  grid,
  selectedFeature,
  selectGrid,
  setLocation: submitLocation,
}) => {
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    isLatValid: true,
    isLongValid: true,
  })

  const { latitude, longitude, isLatValid, isLongValid } = location

  const canSubmit =
    isLatValid && isLongValid && latitude !== '' && longitude !== ''

  const handleSubmitLocation = () => {
    if (canSubmit) {
      submitLocation({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      })
    }
  }

  const handleLatitudeChange = ({ target: { value } }) => {
    setLocation({
      ...location,
      latitude: value,
      isLatValid: value === '' || Math.abs(parseFloat(value)) < 89,
    })
  }
  const handleLongitudeChange = ({ target: { value } }) => {
    setLocation({
      ...location,
      longitude: value,
      isLongValid: value === '' || Math.abs(parseFloat(value)) <= 180,
    })
  }

  const buttonProps = {
    secondary: grid === null,
  }

  return (
    <Wrapper>
      <Section>
        <SectionHeader>
          <Step>1</Step>
          <div>Select Grid:</div>
        </SectionHeader>

        <StyledButtonGroup justifyContent="center">
          <Button
            {...buttonProps}
            primary={grid === 'na_grts'}
            onClick={() => selectGrid('na_grts')}
          >
            GRTS (5-10km)
          </Button>
          <Button
            {...buttonProps}
            primary={grid === 'na_50km'}
            onClick={() => selectGrid('na_50km')}
          >
            50km
          </Button>
          <Button
            {...buttonProps}
            primary={grid === 'na_100km'}
            onClick={() => selectGrid('na_100km')}
          >
            100km
          </Button>
        </StyledButtonGroup>
      </Section>

      {grid && (
        <Section>
          <SectionHeader>
            <Step>2</Step>
            <div>Click on Map or Enter Coordinates:</div>
          </SectionHeader>

          <HelpText style={{ textAlign: 'center', margin: 0 }}>
            Decimal degrees only.
          </HelpText>

          <Flex alignItems="center" justifyContent="space-between" mb="1rem">
            <Box flex="1 1 auto" p="0.5rem">
              <FieldHeader>Latitude</FieldHeader>
              <Input
                type="number"
                value={latitude}
                onChange={handleLatitudeChange}
                invalid={!isLatValid}
              />
            </Box>

            <Box flex="1 1 auto" p="0.5rem">
              <FieldHeader>Longitude</FieldHeader>
              <Input
                type="number"
                value={longitude}
                onChange={handleLongitudeChange}
                invalid={!isLongValid}
              />
            </Box>
          </Flex>

          <Flex justifyContent="flex-end">
            <Button
              primary={canSubmit}
              disabled={!canSubmit}
              onClick={handleSubmitLocation}
            >
              Go to location
            </Button>
          </Flex>
        </Section>
      )}

      {selectedFeature && (
        <>
          <ResultsSection>
            <SectionHeader>Selected Grid Cell:</SectionHeader>
            <Row>
              <Label>Sampling frame:</Label>
              <Value>
                {grid === 'na_grts' ? 'NABat GRTS' : selectedFeature.src}
              </Value>
            </Row>

            <Row>
              <Label>Grid Cell ID:</Label>
              <Value>{selectedFeature.id}</Value>
            </Row>

            <Row>
              <Label>Center latitude:</Label>
              <Value>{formatNumber(selectedFeature.lat, 5)}</Value>
            </Row>

            <Row>
              <Label>Center longitude:</Label>
              <Value>{formatNumber(selectedFeature.long, 5)}</Value>
            </Row>
          </ResultsSection>
        </>
      )}
    </Wrapper>
  )
}

Sidebar.propTypes = {
  grid: PropTypes.string,
  selectedFeature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    long: PropTypes.number.isRequired,
  }),
  selectGrid: PropTypes.func.isRequired,
  setLocation: PropTypes.func.isRequired,
}

Sidebar.defaultProps = {
  grid: null,
  selectedFeature: null,
}

export default Sidebar
