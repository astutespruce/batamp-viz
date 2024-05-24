import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Flex, Text } from 'theme-ui'
import { CaretDown, CaretRight, TimesCircle } from '@emotion-icons/fa-solid'

import { useCrossfilter } from 'components/Crossfilter'
import { useIsEqualCallback, useIsEqualMemo } from 'util/hooks'

import HorizontalBars from './HorizontalBars'
import VerticalBars from './VerticalBars'

const Filter = ({
  field,
  title,
  values,
  labels,
  help,
  isOpen: initIsOpen,
  hideEmpty,
  sort,
  vertical,
}) => {
  const [isOpen, setIsOpen] = useState(initIsOpen)
  const {
    setFilter,
    state: { valueField, filters, dimensionTotals },
  } = useCrossfilter()

  const filterValues = filters[field] || new Set()
  const totals = dimensionTotals[field] || {}
  const max = Math.max(0, ...Object.values(totals))

  // Memoize processing of data, since the context changes frequently
  // but the data that impact this filter may not change as frequently

  const data = useIsEqualMemo(() => {
    // if not isOpen, we can bypass processing the data
    if (!isOpen) {
      return []
    }

    // splice together label, value, and count so that we can filter and sort
    let newData = values.map((value, i) => ({
      value,
      label: labels ? labels[i] : value,
      quantity: totals[value] || 0,
      isFiltered: filterValues.has(value),
      isExcluded: filterValues.size > 0 && !filterValues.has(value),
    }))

    if (hideEmpty) {
      newData = newData.filter(
        ({ quantity, isFiltered }) => quantity > 0 || isFiltered
      )
    }

    if (sort) {
      newData = newData.sort((a, b) => {
        if (a.quantity === b.quantity) {
          return a.label < b.label ? -1 : 1
        }
        return a.quantity < b.quantity ? 1 : -1
      })
    }
    return newData
  }, [filterValues, totals, isOpen])

  const toggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleFilterToggle = useIsEqualCallback(
    (value) => {
      // NOTE: do not mutate filter values or things break
      // (not seen as a state update and memoized function above doesn't fire)!
      // Copy instead.
      const newFilterValues = new Set(filterValues)

      if (newFilterValues.has(value)) {
        newFilterValues.delete(value)
      } else {
        newFilterValues.add(value)
      }

      setFilter(field, newFilterValues)
    },
    [filterValues]
  )

  const handleReset = () => {
    setFilter(field, new Set())
  }

  return (
    <Box
      sx={{
        pt: '0.25rem',
        '&:not(:first-of-type)': {
          borderTop: '1px solid',
          borderTopColor: 'grey.2',
        },
      }}
    >
      <Flex sx={{ justifyContent: 'space-between', gap: '1em' }}>
        <Flex
          sx={{
            alignItems: 'center',
            flex: '1 1 auto',
            cursor: 'pointer',
            gap: '0.25rem',
          }}
          onClick={toggle}
        >
          <Box sx={{ color: 'grey.8' }}>
            {isOpen ? <CaretDown size="1.5em" /> : <CaretRight size="1.5em" />}
          </Box>
          <Text sx={{ fontSize: 3, fontWeight: isOpen ? 'bold' : 'inherit' }}>
            {title}
          </Text>
        </Flex>

        <Box
          sx={{
            visibility: filterValues.size > 0 ? 'visible' : 'hidden',
            color: 'highlight.5',
            cursor: 'pointer',
          }}
          onClick={handleReset}
        >
          <TimesCircle size="1em" />
        </Box>
      </Flex>

      {isOpen && (
        <>
          {data.length > 0 && max > 0 ? (
            <Box sx={{ pt: '0.5rem', pl: '1rem' }}>
              {vertical ? (
                <VerticalBars
                  data={data}
                  max={max}
                  onToggleFilter={handleFilterToggle}
                />
              ) : (
                <HorizontalBars
                  data={data}
                  max={max}
                  showCount={!(field === 'species' && valueField === 'species')}
                  onToggleFilter={handleFilterToggle}
                />
              )}

              {help && (
                <Text variant="help" sx={{ mb: '1rem' }}>
                  {help}
                </Text>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                color: 'grey.6',
                textAlign: 'center',
                fontStyle: 'italic',
                fontSize: 'smaller',
              }}
            >
              No data available
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

Filter.propTypes = {
  field: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  values: PropTypes.array.isRequired,
  labels: PropTypes.array,
  help: PropTypes.string,
  isOpen: PropTypes.bool,
  hideEmpty: PropTypes.bool,
  sort: PropTypes.bool,
  vertical: PropTypes.bool,
}

Filter.defaultProps = {
  labels: null,
  help: null,
  isOpen: false,
  hideEmpty: false,
  sort: false,
  vertical: false,
}

export default Filter
