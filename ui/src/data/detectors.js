import { csvParse, autoType } from 'd3-dsv'
import { useStaticQuery, graphql } from 'gatsby'

import { SPECIES_ID } from '../../config/constants'

/**
 * Parse detector data with packed CSV and metadata into
 * one record per detector
 */
export const useDetectors = () => {
  const {
    detectorsJson: {
      admin,
      callId,
      contributors,
      datasets,
      detMfg,
      detModel,
      micType,
      reflType,
      detectorsCSV,
    },
  } = useStaticQuery(graphql`
    query allDetectorsQuery {
      detectorsJson {
        admin
        callId
        contributors
        datasets
        detMfg
        detModel
        micType
        reflType
        detectorsCSV: detectors
      }
    }
  `)

  const adminIds = admin.map((d) => d.split(':'))
  const datasetIds = datasets.map((d) => d.split('|'))

  return csvParse(detectorsCSV, autoType).map(
    ({
      detector: id,
      admin: adminId,
      callIdId,
      contributorsId,
      datasetsId,
      detMfgId,
      detModelId,
      micTypeId,
      reflTypeId,
      species,
      targetSpecies,
      ...rest
    }) => ({
      id,
      country: adminId ? adminIds[adminId][0] : null,
      admin1Name: adminId ? adminIds[adminId][1] : 'Offshore',
      callId: callId[callIdId] || null,
      contributors: contributors[contributorsId] || null,
      datasets: datasetIds[datasetsId] || null,
      detMfg: detMfg[detMfgId] || null,
      detModel: detModel[detModelId] || null,
      micType: micType[micTypeId] || null,
      reflType: reflType[reflTypeId] || null,
      species:
        species !== null
          ? species
              .toString()
              .split('|')
              .map((speciesId) => SPECIES_ID[parseInt(speciesId, 10)])
          : [],
      targetSpecies:
        targetSpecies !== null
          ? targetSpecies
              .toString()
              .split('|')
              .map((speciesId) => SPECIES_ID[parseInt(speciesId, 10)])
          : [],
      ...rest,
    })
  )
}
