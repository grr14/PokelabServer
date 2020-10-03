const { gql } = require("apollo-server")

typeDefs = gql`
  type Query {
    pokemon(id: Int): Pokemon
    pokemonPartial(id: Int): Pokemon
    pokemonsInRange(firstId: Int, lastId: Int): [Pokemon]
    pokemonByTypeId(id: Int): [Pokemon]
    pokemonSprites(id: Int): [Sprite]
    pokemonEvolveChain(id: Int): [Pokemon]
    abilityById(id: Int): Ability
    abilitiesByPokemonId(id: Int): [Ability]
    getStatsByPokemonId(id: Int): Stats
    pokemonsByAbilityId(id: Int): [Pokemon]
    getAllAbilities: [Ability]
    getPokemonPokedexEntries(id: Int): [FlavorText]
    moveById(id: Int): Move
    movesByPokemonAndVersion(pokemonId: Int, versionId: Int): [MoveDetail]
    getAllMoves: [Move]
    pokemonsByMoveAndVersionGroup(moveId: Int, versionGroupId: Int): [Pokemon]
    encountersByPokemonAndVersion(pokemonId: Int, versionId: Int): [Encounter]
    encountersByLocationAndVersion(locationId: Int, versionId: Int): [Encounter]
  }

  type Pokemon {
    id: Int!
    identifier: String!
    species_id: Int
    height: Int
    weight: Int
    base_experience: Int
    ordre: Int
    is_default: Int
    type_1: Int
    type_2: Int
    abilities: [Ability]
    evolve_from_pokemon_id: Int
    evolution_chain_id: Int
    evolution: EvolutionSummary
    category: String
    picture: String
    gender_distribution: Int
    capture_rate: Int
    base_happiness: Int
    growth_rate: Int
    pokedex_numbers: [PokedexNumber]
    moves: [MoveDetail]
  }

  type Sprite {
    pokemon_id: Int!
    description: String!
    sprite_url: String
  }

  type Ability {
    id: Int!
    identifier: String
    is_hidden: Int
    generation: Int
    effect: String
    flavor_textes: [FlavorText]
  }

  type FlavorText {
    text: String
    version_group: Int
  }

  type EvolutionSummary {
    id: Int
    evolved_pokemon_id: Int
    evolution_trigger: Int
    trigger_item: Int
    minimum_level: Int
    gender: Int
    location: Int
    held_item: Int
    time_of_day: String
    known_move: Int
    known_move_type: Int
    minimum_happiness: Int
    minimum_beauty: Int
    minimum_affection: Int
    physical_stats: Int
    pokemon_in_party: Int
    pokemon_type_in_party: Int
    trading_species: Int
    overworld_rain: Int
    device_upside_down: Int
  }

  type Stats {
    hp: Stat
    attack: Stat
    defense: Stat
    special_attack: Stat
    special_defense: Stat
    speed: Stat
  }

  type Stat {
    base_stat: Int
    effort: Int
  }

  type PokedexNumber {
    id: Int
    pokemon_number: Int
  }

  type Move {
    id: Int!
    identifier: String!
    generation_id: Int
    type_id: Int
    power: Int
    pp: Int
    accuracy: Int
    priority: Int
    target_id: Int
    damage_class_id: Int
    effect_id: Int
    effect_chance: Int
    flavor_textes: [FlavorText]
    detailed_effect: FlavorText
  }

  type MoveDetail {
    move: Move
    learning_method: Int
    level_learned: Int
    order: Int
  }

  type Encounter {
    id: Int
    version: Int
    location: Location
    method: Int
    level_min: Int
    level_max: Int
    rarity: Int
    pokemon: Pokemon
  }

  type LocationArea {
    id: Int
    identifier: String
  }

  type Location {
    id: Int
    region: Int
    identifier: String
    location_area: LocationArea
  }
`
module.exports = typeDefs
