import React, { useState, memo } from 'react'
import PropTypes from 'prop-types'

import { Text } from 'components/Text'
import { Flex, Box } from 'components/Grid'

import styled, { themeGet } from 'style'

const Wrapper = styled.div`
  cursor: pointer;
  position: absolute;
  max-width: 200px;
  right: 10px;
  bottom: 24px;
  z-index: 10000;
  background-color: #fff;
  border-radius: 0.5rem;
  border: 1px solid ${themeGet('colors.grey.400')};
  box-shadow: 1px 1px 4px #666;
  padding: 0.25rem 0.5rem 0.5rem;
`

const Title = styled(Text).attrs({
  fontSize: ['0.8rem', '0.8rem', '1rem'],
})`
  line-height: 1.2;
`

const Entry = styled(Flex).attrs({
  alignItems: 'center',
})`
  &:not(:first-child) {
    margin-top: 0.25rem;
  }
`
// sized to the max size of all patches / circles
const CircleContainer = styled(Flex).attrs({
  justifyContent: 'center',
  alignItems: 'center',
})`
  width: 36px;
  text-align: center;
`

const Patch = styled(Box).attrs({
  flex: 0,
})`
  flex: 0 0 1.25rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: ${({ color }) => color || 'transparent'};
  border-style: solid;
  border-width: ${({ borderWidth }) => borderWidth || 0}px;
  border-color: ${({ borderColor }) => borderColor || 'transparent'};
  border-radius: 0.25rem;
`

const Label = styled(Box).attrs({})`
  font-size: 0.7rem;
  color: ${themeGet('colors.grey.800')};
  margin-left: 0.5rem;
`

const Note = styled(Text)`
  font-size: 0.8rem;
  color: ${themeGet('colors.grey.600')};
  line-height: 1.1;
`

const Circle = ({ radius, color, borderColor, borderWidth, scale }) => {
  const width = 2 * borderWidth + 2 * radius * scale
  const center = width / 2

  return (
    <svg style={{ width, height: width }}>
      <circle
        cx={center}
        cy={center}
        r={radius * scale}
        fill={color}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
    </svg>
  )
}

Circle.propTypes = {
  radius: PropTypes.number.isRequired,
  color: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  scale: PropTypes.number,
}

Circle.defaultProps = {
  borderWidth: 0,
  color: null,
  borderColor: null,
  scale: 1,
}

const Legend = ({ title, entries, note }) => {
  if (!(entries.length || note)) return null

  const [isClosed, setIsClosed] = useState(false)
  const toggle = () => setIsClosed(prevIsClosed => !prevIsClosed)

  return (
    <Wrapper onClick={toggle}>
      {isClosed ? (
        <Title>Legend</Title>
      ) : (
        <div>
          {title && <Title>{title}</Title>}
          {entries.map(({ type, label, ...entry }) => (
            <Entry key={label}>
              {type === 'circle' ? (
                <CircleContainer>
                  <Circle scale={1} {...entry} />
                </CircleContainer>
              ) : (
                <Patch {...entry} />
              )}
              <Label>{label}</Label>
            </Entry>
          ))}

          {note && <Note>{note}</Note>}
        </div>
      )}
    </Wrapper>
  )
}

Legend.propTypes = {
  title: PropTypes.string,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string,
      borderColor: PropTypes.string,
      borderWidth: PropTypes.number,
      radius: PropTypes.number,
    })
  ),
  note: PropTypes.string,
}

Legend.defaultProps = {
  title: null,
  entries: [],
  note: null,
}

export default memo(Legend)
