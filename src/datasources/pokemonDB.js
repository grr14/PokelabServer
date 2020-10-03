const { DataSource } = require("apollo-datasource")
const { parse, isEmptyArray } = require("../utils")
const { Op } = require("sequelize")
const _ = require("lodash")

const NB_POKEMON = 807
const NB_TYPES = 18
const NB_EVOLVE_CHAIN = 427
const NB_ABILITIES = 233
const NB_MOVES = 728
const NB_VERSION_GROUP = 18
const NB_LOCATIONS = 798
const NB_VERSIONS = 30

class pokemonDB extends DataSource {
  constructor({ store }) {
    super()
    this.store = store
  }

  async findPokemonPartial({ id }) {
    if (id < 0 || id > NB_POKEMON) return null

    let pokemon = await this.store.pokemon.findOne({
      attributes: ["id", "identifier", "picture"],
      where: { id: id },
    })

    return pokemon
  }

  async findPokemon({ id }) {
    if (id < 0 || id > NB_POKEMON) return null

    let pokemon = await this.store.pokemon.findOne({ where: { id: id } })

    const abilities_id = parse(pokemon.dataValues.abilities, ",")

    const abilities = new Array()

    await Promise.all(
      abilities_id.map(async (ability_id) => {
        let ability = await this.store.abilities.findOne({
          attributes: ["id", "identifier"],
          where: { id: ability_id },
        })
        let hidden = await this.store.pokemon_abilities.findOne({
          attributes: ["is_hidden"],
          where: {
            [Op.and]: [
              {
                pokemon_id: id,
              },
              {
                ability_id: ability_id,
              },
            ],
          },
        })

        const final_ab = {
          id: ability.id,
          identifier: ability.identifier,
          is_hidden: hidden.is_hidden,
        }
        return abilities.push(final_ab)
      })
    )

    const evolution = await this.store.evolutions.findOne({
      where: { evolved_pokemon_id: id },
    })

    const pokedexNumbers = await this.store.pokedex_numbers.findAll({
      attributes: ["pokedex_id", "pokedex_number"],
      where: { species_id: id },
    })
    const reducedPokedexNumbersNames = pokedexNumbers.map((el) => ({
      id: el.pokedex_id,
      pokemon_number: el.pokedex_number,
    }))

    return {
      ...pokemon.dataValues,
      abilities: abilities,
      evolution: !!evolution ? evolution.dataValues : null,
      pokedex_numbers: reducedPokedexNumbersNames,
      moves: null,
    }
  }

  async pokemonsInRange({ firstId, lastId }) {
    if (firstId > lastId) {
      let [firstId, lastId] = [lastId, firstId]
    }
    if (lastId > NB_POKEMON) {
      return null
    }

    const pokemons = await this.store.pokemon.findAll({
      attributes: ["id", "identifier", "type_1", "type_2", "picture"],
      where: {
        id: { [Op.between]: [firstId, lastId] },
      },
    })

    console.log(`${JSON.stringify(pokemons)}`)

    return pokemons
  }

  async findPokemonsByTypeId({ id }) {
    if (id < 0 || id > NB_TYPES) {
      return null
    }

    const pokemons = await this.store.pokemon.findAll({
      attributes: ["id", "identifier", "type_1", "type_2", "picture"],
      where: {
        [Op.or]: [{ type_1: id }, { type_2: id }],
      },
    })

    return pokemons
  }

  async getPokemonSprites({ id }) {
    if (id > NB_POKEMON) {
      return null
    }
    const sprites = await this.store.sprites.findAll({
      where: { pokemon_id: id },
    })
    if (isEmptyArray(sprites)) {
      return null
    }

    return sprites
  }

  async getPokemonEvolveChain({ id }) {
    if (id > NB_EVOLVE_CHAIN) {
      return null
    }
    const allEvolutionChain = await this.store.pokemon.findAll({
      attributes: [
        "id",
        "identifier",
        "type_1",
        "type_2",
        "evolve_from_pokemon_id",
        "evolution_chain_id",
        "picture",
      ],
      where: { evolution_chain_id: id },
      order: [["ordre", "ASC"]],
    })

    let allEvolutionsDatas
    await Promise.all(
      (allEvolutionsDatas = allEvolutionChain.map(async (pokemon) => {
        let evolution = await this.store.evolutions.findOne({
          where: { evolved_pokemon_id: pokemon.id },
        })
        let p = {
          ...pokemon.dataValues,
          evolution: !!evolution ? evolution.dataValues : null,
        }
        return p
      }))
    )

    return allEvolutionsDatas
  }

  reduceAbility(ability, texts) {
    const flavor_textes = texts.map((el) => ({
      version_group: el.version_group_id,
      text: el.flavor_text,
    }))

    return {
      id: ability.id,
      identifier: ability.identifier,
      generation: ability.generation_id,
      effect: ability.effect,
      flavor_textes: flavor_textes,
    }
  }

  async getAbilityById({ id }) {
    if (id > NB_ABILITIES) {
      return null
    }
    const ability = await this.store.abilities.findOne({ where: { id: id } })
    const texts = await this.store.ability_flavor_text.findAll({
      where: { ability_id: id },
    })

    return this.reduceAbility(ability, texts)
  }

  async getStatsById({ id }) {
    if (id < 0 || id > NB_POKEMON) return null

    const statsName = [
      "hp",
      "attack",
      "defense",
      "special_attack",
      "special_defense",
      "speed",
    ]
    const pokemonStats = await this.store.stats.findAll({
      where: { pokemon_id: id },
    })

    const reducedStats = pokemonStats.map((stat) => ({
      base_stat: stat.dataValues.base_stat,
      effort: stat.dataValues.effort,
    }))

    let stats = {}
    for (let i = 0; i < 6; i++) {
      stats[statsName[i]] = reducedStats[i]
    }

    return stats
  }

  /* select id, identifier,... from pokemon where
  abilities LIKE 'id%' OR abilities LIKE '%,id,%' OR
  abilities LIKE '%,id' or abilites = 'id;*/
  async getPokemonByAbilityId({ id }) {
    if (id > NB_ABILITIES) {
      return null
    }

    const pokemons = await this.store.pokemon.findAll({
      attributes: ["id", "identifier", "type_1", "type_2", "picture"],
      where: {
        [Op.or]: [
          { abilities: { [Op.like]: `${id},%` } },
          { abilities: { [Op.like]: `%,${id},%` } },
          { abilities: { [Op.like]: `%,${id}` } },
          { abilities: { [Op.eq]: `${id}` } },
        ],
      },
    })

    let hidden = []
    await Promise.all(
      pokemons.map(async (pokemon) => {
        let tmp = await this.store.pokemon_abilities.findOne({
          attributes: ["pokemon_id", "is_hidden"],
          where: {
            [Op.and]: [{ pokemon_id: pokemon.id }, { ability_id: id }],
          },
        })

        return hidden.push(tmp)
      })
    )

    return pokemons.map((pokemon) => ({
      id: pokemon.id,
      identifier: pokemon.identifier,
      type_1: pokemon.type_1,
      type_2: pokemon.type_2,
      picture: pokemon.picture,
      abilities: [
        {
          is_hidden:
            hidden[hidden.findIndex((el) => el.pokemon_id === pokemon.id)]
              .is_hidden,
        } /* we dont care about the pokemon's other abilities in this query */,
      ],
    }))
  }

  async getAllAbilities() {
    const abilities = await this.store.abilities.findAll({
      attributes: ["id", "identifier", "generation_id"],
      order: [["id", "ASC"]],
    })

    const reduceAbility = abilities.map((el) => ({
      id: el.id,
      identifier: el.identifier,
      generation: el.generation_id,
    }))

    return reduceAbility
  }

  async pokemonPokedexEntries({ id }) {
    const entries = await this.store.pokedex_entries.findAll({
      where: { species_id: id },
    })

    return entries.map((entry) => ({
      version_group: entry.version_id,
      text: entry.flavor_text,
    }))
  }

  async getMoveById({ id }) {
    if (id > NB_MOVES) {
      return null
    }

    const move = await this.store.moves.findOne({
      where: { id: id },
    })

    const flavor_textes = await this.store.move_flavor_text.findAll({
      attributes: ["version_group_id", "flavor_text"],
      where: { move_id: id },
      order: [["version_group_id", "ASC"]],
    })

    const detailed_text = await this.store.move_detailed_text.findOne({
      where: { id: move.effect_id },
    })

    return {
      ...move.dataValues,
      flavor_textes: flavor_textes.map((ft) => ({
        version_group: ft.version_group_id,
        text: ft.flavor_text,
      })),
      detailed_effect: {
        text: detailed_text != null ? detailed_text.effect : null,
      },
    }
  }

  async getMovesByPokemonAndVersion({ pokemonId, versionId }) {
    const movesDetails = await this.store.pokemon_moves.findAll({
      attributes: ["move_id", "pokemon_move_method_id", "level", "order"],
      where: {
        [Op.and]: [{ pokemon_id: pokemonId }, { version_group_id: versionId }],
      },
      order: [
        ["pokemon_move_method_id", "ASC"],
        ["level", "ASC"],
      ],
    })

    const moves = []

    await Promise.all(
      movesDetails.map(async (moveD) => {
        let tmp = await this.store.moves.findOne({
          where: { id: moveD.move_id },
        })
        return moves.push({
          id: tmp.id,
          identifier: tmp.identifier,
          generation_id: tmp.generation_id,
          type_id: tmp.type_id,
          power: tmp.power,
          pp: tmp.pp,
          accuracy: tmp.accuracy,
          priority: tmp.priority,
          target_id: tmp.target_id,
          damage_class_id: tmp.damage_class_id,
          effect_id: tmp.effect_id,
          effect_chance: tmp.effect_chance,
        })
      })
    )

    const allMoves = movesDetails.map((move, idx) => {
      return {
        learning_method: move.pokemon_move_method_id,
        level_learned: move.level,
        order: move.order,
        move: moves[idx],
      }
    })

    return allMoves
  }

  async getAllMoves() {
    const moves = await this.store.moves.findAll({
      where: { id: { [Op.lte]: NB_MOVES } },
    })

    return moves.map((move) => ({ ...move.dataValues, flavor_textes: null }))
  }

  async getPokemonsByMoveAndVersionGroup({ moveId, versionGroupId }) {
    if (moveId > NB_MOVES || versionGroupId > NB_VERSION_GROUP) {
      return null
    }
    const allMovesInfos = await this.store.pokemon_moves.findAll({
      attributes: ["pokemon_id", "pokemon_move_method_id", "level"],
      where: {
        [Op.and]: [{ move_id: moveId }, { version_group_id: versionGroupId }],
      },
      order: [["pokemon_id", "ASC"]],
    })

    const reduced = _(allMovesInfos).groupBy("pokemon_id").value()
    const evenMoreReduced = _.map(reduced, (el) => el).map((array) => ({
      id: array.map((el) => el.pokemon_id)[0],
      moves: array.map((el) => ({
        learning_method: el.pokemon_move_method_id,
        level_learned: el.level,
      })),
    }))

    const pokemons = []
    await Promise.all(
      evenMoreReduced.map(async (moveDetail) => {
        let pokemon = await this.store.pokemon.findOne({
          attributes: ["id", "identifier", "type_1", "type_2", "picture"],
          where: {
            id: moveDetail.id,
          },
          order: [["id", "ASC"]],
        })
        return pokemons.push(pokemon)
      })
    )

    return pokemons
      .map((pokemon) => {
        return {
          id: pokemon.id,
          identifier: pokemon.identifier,
          type_1: pokemon.type_1,
          type_2: pokemon.type_2,
          picture: pokemon.picture,
          moves:
            evenMoreReduced[
              evenMoreReduced.findIndex((el) => el.id === pokemon.id)
            ].moves,
        }
      })
      .sort((a, b) => a.id - b.id)
  }

  async getEncountersByPokemonAndVersion({ pokemonId, versionId }) {
    if (pokemonId > 712 || versionId > NB_VERSIONS) {
      /* dont have more datas in the db (no genVII) */
      return null
    }

    const encounters = await this.store.encounters.findAll({
      where: {
        [Op.and]: [{ pokemon_id: pokemonId }, { version_id: versionId }],
      },
      order: [["version_id", "ASC"]],
    })

    let location_area = []
    await Promise.all(
      encounters.map(async (encounter) => {
        let loc = await this.store.location_areas.findOne({
          attributes: ["id", "location_id"],
          where: { id: encounter.location_area_id },
        })
        return location_area.push({ ...loc.dataValues, tmpId: encounter.id })
      })
    )

    let location = []
    await Promise.all(
      location_area.map(async (loc) => {
        let l = await this.store.locations.findOne({
          where: { id: loc.location_id },
        })
        return location.push({ ...l.dataValues, tmpId: loc.tmpId })
      })
    )

    let encounter_slot = []
    await Promise.all(
      encounters.map(async (encounter) => {
        let enc = await this.store.encounter_slots.findOne({
          attributes: ["id", "encounter_method_id", "rarity"],
          where: { id: encounter.encounter_slot_id },
        })
        return encounter_slot.push({ ...enc.dataValues, tmpId: encounter.id })
      })
    )

    const finalEcounters = encounters.map((el) => {
      const locIdx = location.findIndex((l) => l.tmpId === el.id)
      const encIdx = encounter_slot.findIndex((l) => l.tmpId === el.id)
      return {
        id: el.id,
        version: el.version_id,
        location: {
          id: location[locIdx].id,
          region: location[locIdx].region_id,
          identifier: location[locIdx].identifier,
          location_area: null,
        },
        method: encounter_slot[encIdx].encounter_method_id,
        level_min: el.min_level,
        level_max: el.max_level,
        slot: encounter_slot[encIdx].slot,
        rarity: encounter_slot[encIdx].rarity,
      }
    })

    /* the db stores one line per level of Pokemon you can meet, with the %age by level.
    We only want to get the level range but not the %age, and we especially only want one Encounter 
    object per version and area */

    const groupByVersion = _(finalEcounters).groupBy("version").value()

    const groupByVersionReduced = _.map(groupByVersion, (el) => el).map(
      (array) =>
        array.reduce((acc, cur) => {
          let locationId = cur.location.id
          let found = acc.find((elem) => elem.location.id === locationId)
          if (found) {
            found.rarity += cur.rarity

            if (cur.level_min < found.level_min) {
              found.level_min = cur.level_min
            }
            if (cur.level_max > found.level_max) {
              found.level_max = cur.level_max
            }
          } else {
            acc.push(cur)
          }
          return acc
        }, [])
    )

    return groupByVersionReduced.flat().sort((a, b) => {
      if (a.version === b.version) {
        return a.location.identifier.localeCompare(b.location.identifier)
      }
      return a.version - b.version
    })
  }

  async getEncountersByLocationAndVersion({ locationId, versionId }) {
    if (locationId > NB_LOCATIONS || versionId > NB_VERSIONS) {
      return null
    }

    const location_areas = await this.store.location_areas.findAll({
      where: {
        location_id: locationId,
      },
    })

    const encounters = []
    await Promise.all(
      location_areas.map(async (el) => {
        let tmp = await this.store.encounters.findAll({
          where: {
            [Op.and]: [{ location_area_id: el.id }, { version_id: versionId }],
          },
        })
        return encounters.push(tmp)
      })
    )

    const flatEncounters = encounters.flat()

    const locationInfos = await this.store.locations.findOne({
      where: {
        id: locationId,
      },
    })

    const encounter_slots = []
    await Promise.all(
      flatEncounters.map(async (enc) => {
        let tmp = await this.store.encounter_slots.findOne({
          where: {
            id: enc.encounter_slot_id,
          },
        })
        return encounter_slots.push(tmp)
      })
    )

    const pokemons = []
    await Promise.all(
      flatEncounters.map(async (enc) => {
        const tmp = await this.store.pokemon.findOne({
          attributes: ["id", "identifier", "type_1", "type_2", "picture"],
          where: {
            id: enc.pokemon_id,
          },
        })
        return pokemons.push(tmp)
      })
    )

    const reducedFlatEncounters = flatEncounters.map((el) => {
      const idx = encounter_slots.findIndex(
        (encounter_slot) => encounter_slot.id === el.encounter_slot_id
      )
      const idxLocArea = location_areas.findIndex(
        (loc) => loc.id === el.location_area_id
      )

      const idxPokemon = pokemons.findIndex((pok) => pok?.id === el.pokemon_id)
      if (idxPokemon === -1) {
        return null
      }

      return {
        id: el.id,
        version: el.version_id,
        location: {
          id: locationId,
          region: locationInfos.region_id,
          identifier: locationInfos.identifier,
          location_area: {
            id: location_areas[idxLocArea].id,
            identifier: location_areas[idxLocArea].identifier,
          },
        },
        method: encounter_slots[idx].encounter_method_id,
        level_min: el.min_level,
        level_max: el.max_level,
        rarity: encounter_slots[idx].rarity,
        pokemon: {
          id: el.pokemon_id,
          identifier: pokemons[idxPokemon].identifier,
          type_1: pokemons[idxPokemon].type_1,
          type_2: pokemons[idxPokemon].type_2,
          picture: pokemons[idxPokemon].picture,
        },
      }
    })

    const encountersFinal = reducedFlatEncounters.reduce((acc, cur) => {
      if (cur === null) {
        return acc
      }
      let curPokemonId = cur.pokemon.id
      let curPokemonEncMethod = cur.method
      let curLocationArea = cur.location.location_area.id

      let found = acc.find(
        (el) =>
          el.pokemon.id === curPokemonId &&
          el.method === curPokemonEncMethod &&
          el.location.location_area.id === curLocationArea
      )

      if (found) {
        found.rarity += cur.rarity

        if (cur.level_min < found.level_min) {
          found.level_min = cur.level_min
        }
        if (cur.level_max > found.level_max) {
          found.level_max = cur.level_max
        }
      } else {
        acc.push(cur)
      }
      return acc
    }, [])

    return encountersFinal.sort((a, b) => {
      if (a.location.location_area === b.location.location_area) {
        if (a.method === b.method) {
          return a.method - b.method
        }
        return a.pokemon.id - b.pokemon.id
      }
      return a.location.location_area - b.location.location_area
    })
  }
}

module.exports = pokemonDB
