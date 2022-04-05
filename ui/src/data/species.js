import { csvParse, autoType } from 'd3-dsv'
import { useStaticQuery, graphql } from 'gatsby'

export const useSpeciesTS = () => {
  const {
    speciesTsJson: { columns, years, tsData },
  } = useStaticQuery(graphql`
    query allSpeciesTSQuery {
      speciesTsJson {
        columns
        years
        tsData {
          species
          ts
        }
      }
    }
  `)

  const data = []

  // Note: 0 is implicit and is left out of the CSV data
  tsData.forEach(({ species, ts: csv }) => {
    const parsed = csvParse(
      `${columns}\n${csv.replace(/\|/g, '\n')}`,
      ({
        detector,
        year = '',
        month = '',
        detectorNights = '',
        detectionNights = '',
        detections = '',
      }) => {
        return {
          species,
          id: parseInt(detector, 10) || 0,
          year: years[parseInt(year, 10) || 0],
          month: parseInt(month, 10) || 0,
          detectorNights: parseInt(detectorNights, 10) || 0,
          detectionNights: parseInt(detectionNights, 10) || 0,
          detections: parseInt(detections) || 0,
        }
      }
    )

    data.push(...parsed)
  })

  return data
}
