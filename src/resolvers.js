module.exports = {
  Query: {
    pokemon: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.findPokemon({ id }),
    pokemonPartial: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.findPokemonPartial({ id }),
    pokemonsInRange: async (_, { firstId, lastId }, { dataSources }, __) =>
      dataSources.postgresDB.pokemonsInRange({ firstId, lastId }),
    pokemonByTypeId: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.findPokemonsByTypeId({ id }),
    pokemonSprites: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getPokemonSprites({ id }),
    pokemonEvolveChain: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getPokemonEvolveChain({ id }),
    abilityById: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getAbilityById({ id }),
    getStatsByPokemonId: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getStatsById({ id }),
    pokemonsByAbilityId: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getPokemonByAbilityId({ id }),
    getAllAbilities: async (_, __, { dataSources }, ___) =>
      dataSources.postgresDB.getAllAbilities(),
    getPokemonPokedexEntries: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.pokemonPokedexEntries({ id }),
    moveById: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getMoveById({ id }),
    movesByPokemonAndVersion: async (
      _,
      { pokemonId, versionId },
      { dataSources },
      __
    ) =>
      dataSources.postgresDB.getMovesByPokemonAndVersion({
        pokemonId,
        versionId,
      }),
    getAllMoves: async (_, __, { dataSources }, ___) =>
      dataSources.postgresDB.getAllMoves(),
    pokemonsByMoveAndVersionGroup: async (
      _,
      { moveId, versionGroupId },
      { dataSources },
      __
    ) =>
      dataSources.postgresDB.getPokemonsByMoveAndVersionGroup({
        moveId,
        versionGroupId,
      }),
    encountersByPokemonAndVersion: async (
      _,
      { pokemonId, versionId },
      { dataSources },
      __
    ) =>
      dataSources.postgresDB.getEncountersByPokemonAndVersion({
        pokemonId,
        versionId,
      }),
    encountersByLocationAndVersion: async (
      _,
      { locationId, versionId },
      { dataSources },
      __
    ) =>
      dataSources.postgresDB.getEncountersByLocationAndVersion({
        locationId,
        versionId,
      }),
    user: async (_, { id }, { dataSources }, __) =>
      dataSources.postgresDB.getUser({ id }),
  },
}
