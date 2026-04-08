import React, { useState, useMemo } from 'react'
import { Upload, BarChart3, Users } from 'lucide-react'

export default function HockeyStatsDashboard() {
  const [data, setData] = useState([])
  const [currentPage, setCurrentPage] = useState('game')
  const [selectedGames, setSelectedGames] = useState([])
  const [selectedTeams, setSelectedTeams] = useState([])
  const [selectedStrengths, setSelectedStrengths] = useState([])
  const [selectedGameTypes, setSelectedGameTypes] = useState([])
  const [gameFiltersOpen, setGameFiltersOpen] = useState(false)
  const [teamFiltersOpen, setTeamFiltersOpen] = useState(false)
  const [strengthFiltersOpen, setStrengthFiltersOpen] = useState(false)
  const [gameTypeFiltersOpen, setGameTypeFiltersOpen] = useState(false)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target.result
      const lines = csv.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] || ''
        })
        return row
      }).filter(row => row.Game)

      setData(parsedData)
    }
    reader.readAsText(file)
  }

  const games = useMemo(() => {
    const unique = [...new Set(data.map(row => row.Game))].sort()
    return unique
  }, [data])

  const teams = useMemo(() => {
    const unique = [...new Set(data.map(row => row.Team))].sort()
    return unique
  }, [data])

  const strengths = useMemo(() => {
    const unique = [...new Set(data.map(row => row.Strength).filter(s => s))]
    return unique
  }, [data])

  const gameTypes = useMemo(() => {
    const gameTypeHeader = Object.keys(data[0] || {}).find(key => key.includes('Game') && key.includes('Type'))
    if (!gameTypeHeader) return []
    const unique = [...new Set(data.map(row => row[gameTypeHeader]).filter(s => s))].sort()
    return unique
  }, [data])

  const toggleGame = (game) => {
    setSelectedGames(prev =>
      prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]
    )
  }

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    )
  }

  const toggleStrength = (strength) => {
    setSelectedStrengths(prev =>
      prev.includes(strength) ? prev.filter(s => s !== strength) : [...prev, strength]
    )
  }

  const toggleGameType = (gameType) => {
    setSelectedGameTypes(prev =>
      prev.includes(gameType) ? prev.filter(g => g !== gameType) : [...prev, gameType]
    )
  }

  const calculateChanceStats = (filteredData) => {
    const stats = {
      Goals: 0,
      Assists: 0,
      'Total Shots Chances': 0,
      'Total Pass Chances': 0,
      'Total Miss + Post': 0,
      'EV Entries': 0,
      'EV Carry-in': 0,
      'EV Passing': 0,
      'EV Uncontrolled': 0,
      'EV Dump-ins': 0
    }

    filteredData.forEach(row => {
      const action = row.ACTION?.toUpperCase() || ''
      const danger = row.Danger?.toUpperCase() || ''
      const strength = row.Strength || ''
      const isHighMedDanger = ['HD', 'MD'].includes(danger)

      if (action === 'GOAL') {
        stats.Goals++
      }

      if (action === 'ASSIST') {
        stats.Assists++
      }

      if (isHighMedDanger && ['S', 'GOAL'].includes(action)) {
        stats['Total Shots Chances']++
      }

      if (isHighMedDanger && ['P', 'ASSIST'].includes(action)) {
        stats['Total Pass Chances']++
      }

      if (isHighMedDanger && ['M', 'POST'].includes(action)) {
        stats['Total Miss + Post']++
      }

      if (strength === 'EV') {
        if (action === 'CE') stats['EV Carry-in']++
        if (action === 'UCE') stats['EV Uncontrolled']++
        if (action === 'D') stats['EV Dump-ins']++
        
        if (['CE', 'UCE', 'D'].includes(action)) {
          stats['EV Entries']++
        }
      }
    })

    stats['Total Chance Plays'] = stats['Total Shots Chances'] + stats['Total Miss + Post']
    return stats
  }

  const gameAnalyticsByTeam = useMemo(() => {
    let filtered = data

    if (selectedGames.length > 0) {
      filtered = filtered.filter(row => selectedGames.includes(row.Game))
    }

    if (selectedStrengths.length > 0) {
      filtered = filtered.filter(row => selectedStrengths.includes(row.Strength))
    }

    const teamStats = {}
    const uniqueTeams = [...new Set(filtered.map(row => row.Team))]
    
    uniqueTeams.forEach(team => {
      const teamData = filtered.filter(row => row.Team === team)
      teamStats[team] = calculateChanceStats(teamData)
    })

    return teamStats
  }, [data, selectedGames, selectedStrengths])

  const gamePlayerStats = useMemo(() => {
    let filtered = data

    if (selectedGames.length > 0) {
      filtered = filtered.filter(row => selectedGames.includes(row.Game))
    }

    if (selectedStrengths.length > 0) {
      filtered = filtered.filter(row => selectedStrengths.includes(row.Strength))
    }

    const playerStats = {}
    filtered.forEach(row => {
      const playerNum = row.Number
      if (!playerNum) return

      if (!playerStats[playerNum]) {
        playerStats[playerNum] = {
          number: playerNum,
          team: row.Team,
          stats: {
            Goals: 0,
            Assists: 0,
            'Total Shots Chances': 0,
            'Total Pass Chances': 0,
            'Total Miss + Post': 0,
            'EV Entries': 0,
            'EV Carry-in': 0,
            'EV Passing': 0,
            'EV Uncontrolled': 0,
            'EV Dump-ins': 0
          }
        }
      }

      const action = row.ACTION?.toUpperCase() || ''
      const danger = row.Danger?.toUpperCase() || ''
      const strength = row.Strength || ''
      const isHighMedDanger = ['HD', 'MD'].includes(danger)

      if (action === 'GOAL') {
        playerStats[playerNum].stats.Goals++
      }

      if (action === 'ASSIST') {
        playerStats[playerNum].stats.Assists++
      }

      if (isHighMedDanger && ['S', 'GOAL'].includes(action)) {
        playerStats[playerNum].stats['Total Shots Chances']++
      }

      if (isHighMedDanger && ['P', 'ASSIST'].includes(action)) {
        playerStats[playerNum].stats['Total Pass Chances']++
      }

      if (isHighMedDanger && ['M', 'POST'].includes(action)) {
        playerStats[playerNum].stats['Total Miss + Post']++
      }

      if (strength === 'EV') {
        if (action === 'CE') playerStats[playerNum].stats['EV Carry-in']++
        if (action === 'UCE') playerStats[playerNum].stats['EV Uncontrolled']++
        if (action === 'D') playerStats[playerNum].stats['EV Dump-ins']++
        
        if (['CE', 'UCE', 'D'].includes(action)) {
          playerStats[playerNum].stats['EV Entries']++
        }
      }
    })

    return Object.values(playerStats).map(player => ({
      ...player,
      stats: {
        ...player.stats,
        'Total Chance Plays': player.stats['Total Shots Chances'] + player.stats['Total Miss + Post']
      }
    })).sort((a, b) => parseInt(a.number) - parseInt(b.number))
  }, [data, selectedGames, selectedStrengths])

  const playerAnalytics = useMemo(() => {
    let filtered = data
    const gameTypeHeader = Object.keys(data[0] || {}).find(key => key.includes('Game') && key.includes('Type'))

    if (selectedTeams.length > 0) {
      filtered = filtered.filter(row => selectedTeams.includes(row.Team))
    }

    if (selectedGames.length > 0) {
      filtered = filtered.filter(row => selectedGames.includes(row.Game))
    }

    if (selectedStrengths.length > 0) {
      filtered = filtered.filter(row => selectedStrengths.includes(row.Strength))
    }

    if (selectedGameTypes.length > 0 && gameTypeHeader) {
      filtered = filtered.filter(row => selectedGameTypes.includes(row[gameTypeHeader]))
    }

    const playerStats = {}
    filtered.forEach(row => {
      const playerNum = row.Number
      const team = row.Team
      if (!playerNum) return

      const playerKey = `${playerNum}_${team}`

      if (!playerStats[playerKey]) {
        playerStats[playerKey] = {
          number: playerNum,
          team: team,
          gamesPlayed: new Set(),
          stats: {
            Goals: 0,
            Assists: 0,
            'Total Shots Chances': 0,
            'Total Pass Chances': 0,
            'Total Miss + Post': 0,
            'EV Entries': 0,
            'EV Carry-in': 0,
            'EV Passing': 0,
            'EV Uncontrolled': 0,
            'EV Dump-ins': 0
          }
        }
      }

      playerStats[playerKey].gamesPlayed.add(row.Game)

      const action = row.ACTION?.toUpperCase() || ''
      const danger = row.Danger?.toUpperCase() || ''
      const strength = row.Strength || ''
      const isHighMedDanger = ['HD', 'MD'].includes(danger)

      if (action === 'GOAL') {
        playerStats[playerKey].stats.Goals++
      }

      if (action === 'ASSIST') {
        playerStats[playerKey].stats.Assists++
      }

      if (isHighMedDanger && ['S', 'GOAL'].includes(action)) {
        playerStats[playerKey].stats['Total Shots Chances']++
      }

      if (isHighMedDanger && ['P', 'ASSIST'].includes(action)) {
        playerStats[playerKey].stats['Total Pass Chances']++
      }

      if (isHighMedDanger && ['M', 'POST'].includes(action)) {
        playerStats[playerKey].stats['Total Miss + Post']++
      }

      if (strength === 'EV') {
        if (action === 'CE') playerStats[playerKey].stats['EV Carry-in']++
        if (action === 'UCE') playerStats[playerKey].stats['EV Uncontrolled']++
        if (action === 'D') playerStats[playerKey].stats['EV Dump-ins']++
        
        if (['CE', 'UCE', 'D'].includes(action)) {
          playerStats[playerKey].stats['EV Entries']++
        }
      }
    })

    return Object.values(playerStats)
      .map(player => ({
        ...player,
        gamesPlayed: player.gamesPlayed.size,
        stats: {
          ...player.stats,
          'Total Chance Plays': player.stats['Total Shots Chances'] + player.stats['Total Pass Chances'] + player.stats['Total Miss + Post']
        }
      }))
      .sort((a, b) => {
        const teamCompare = a.team.localeCompare(b.team)
        if (teamCompare !== 0) return teamCompare
        return parseInt(a.number) - parseInt(b.number)
      })
  }, [data, selectedTeams, selectedGames, selectedStrengths, selectedGameTypes])

  const StatCard = ({ label, value }) => (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hockey Stats</h1>
              <p className="text-slate-400 text-sm mt-1">Advanced Analytics Dashboard</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors">
              <Upload size={18} />
              <span className="text-sm font-medium">Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage('game')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'game'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <BarChart3 size={18} />
              Game Analytics
            </button>
            <button
              onClick={() => setCurrentPage('player')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'player'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Users size={18} />
              Player Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {data.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-12 bg-slate-800/50 rounded-2xl border border-slate-700">
              <Upload size={48} className="mx-auto mb-4 text-slate-500" />
              <h2 className="text-xl font-bold mb-2">Upload Your CSV</h2>
              <p className="text-slate-400 max-w-md">Export your "All Games" tab from Google Sheets as CSV and upload it to get started</p>
            </div>
          </div>
        ) : currentPage === 'game' && Object.keys(gameAnalyticsByTeam).length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="relative">
                <button
                  onClick={() => setGameFiltersOpen(!gameFiltersOpen)}
                  className="w-full text-left bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                >
                  <span>{selectedGames.length === 0 ? 'Select Games' : `${selectedGames.length} selected`}</span>
                  <span>▼</span>
                </button>
                {gameFiltersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      {games.map(game => (
                        <label key={game} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedGames.includes(game)} onChange={() => toggleGame(game)} className="w-4 h-4" />
                          <span className="text-sm">{game}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setStrengthFiltersOpen(!strengthFiltersOpen)}
                  className="w-full text-left bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                >
                  <span>{selectedStrengths.length === 0 ? 'Select Strength' : `${selectedStrengths.length} selected`}</span>
                  <span>▼</span>
                </button>
                {strengthFiltersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                    <div className="p-3">
                      {strengths.map(strength => (
                        <label key={strength} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedStrengths.includes(strength)} onChange={() => toggleStrength(strength)} className="w-4 h-4" />
                          <span className="text-sm">{strength}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {Object.keys(gameAnalyticsByTeam).map(team => (
              <div key={team} className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">{team}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <StatCard label="Goals" value={gameAnalyticsByTeam[team].Goals} />
                  <StatCard label="Assists" value={gameAnalyticsByTeam[team].Assists} />
                  <StatCard label="Total Chance Plays" value={gameAnalyticsByTeam[team]['Total Chance Plays']} />
                  <StatCard label="Total Shots Chances" value={gameAnalyticsByTeam[team]['Total Shots Chances']} />
                  <StatCard label="Total Pass Chances" value={gameAnalyticsByTeam[team]['Total Pass Chances']} />
                  <StatCard label="Total Miss + Post" value={gameAnalyticsByTeam[team]['Total Miss + Post']} />
                  <StatCard label="EV Entries" value={gameAnalyticsByTeam[team]['EV Entries']} />
                  <StatCard label="EV Carry-in" value={gameAnalyticsByTeam[team]['EV Carry-in']} />
                  <StatCard label="EV Passing" value={gameAnalyticsByTeam[team]['EV Passing']} />
                  <StatCard label="EV Uncontrolled" value={gameAnalyticsByTeam[team]['EV Uncontrolled']} />
                  <StatCard label="EV Dump-ins" value={gameAnalyticsByTeam[team]['EV Dump-ins']} />
                </div>

                <h3 className="text-xl font-bold text-slate-300 mb-3">Player Statistics - {team}</h3>
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-700/50 border-b border-slate-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">No.</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Goals</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Assists</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Chances</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Shots</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Passes</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Miss/Post</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">EV Entries</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Carry-in</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Passing</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Uncontrolled</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Dump-ins</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gamePlayerStats.filter(p => p.team === team).length === 0 ? (
                          <tr>
                            <td colSpan="12" className="px-4 py-8 text-center text-slate-400">No player data available</td>
                          </tr>
                        ) : (
                          gamePlayerStats.filter(p => p.team === team).map((player, idx) => (
                            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 font-bold text-blue-400">{player.number}</td>
                              <td className="px-4 py-3 text-right font-semibold text-yellow-400">{player.stats.Goals}</td>
                              <td className="px-4 py-3 text-right font-semibold text-cyan-400">{player.stats.Assists}</td>
                              <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Chance Plays']}</td>
                              <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Shots Chances']}</td>
                              <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Pass Chances']}</td>
                              <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Miss + Post']}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Entries']}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Carry-in']}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Passing']}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Uncontrolled']}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Dump-ins']}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="relative">
                <button
                  onClick={() => setTeamFiltersOpen(!teamFiltersOpen)}
                  className="w-full text-left bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                >
                  <span>{selectedTeams.length === 0 ? 'Select Teams' : `${selectedTeams.length} selected`}</span>
                  <span>▼</span>
                </button>
                {teamFiltersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      {teams.map(team => (
                        <label key={team} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedTeams.includes(team)} onChange={() => toggleTeam(team)} className="w-4 h-4" />
                          <span className="text-sm">{team}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setGameFiltersOpen(!gameFiltersOpen)}
                  className="w-full text-left bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                >
                  <span>{selectedGames.length === 0 ? 'Select Games' : `${selectedGames.length} selected`}</span>
                  <span>▼</span>
                </button>
                {gameFiltersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      {games.map(game => (
                        <label key={game} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedGames.includes(game)} onChange={() => toggleGame(game)} className="w-4 h-4" />
                          <span className="text-sm">{game}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setStrengthFiltersOpen(!strengthFiltersOpen)}
                  className="w-full text-left bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                >
                  <span>{selectedStrengths.length === 0 ? 'Select Strength' : `${selectedStrengths.length} selected`}</span>
                  <span>▼</span>
                </button>
                {strengthFiltersOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                    <div className="p-3">
                      {strengths.map(strength => (
                        <label key={strength} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedStrengths.includes(strength)} onChange={() => toggleStrength(strength)} className="w-4 h-4" />
                          <span className="text-sm">{strength}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setGameTypeFiltersOpen(!gameTypeFiltersOpen)}
                  className="w-full text-left bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                >
                  <span>{selectedGameTypes.length === 0 ? 'Select Game Type' : `${selectedGameTypes.length} selected`}</span>
                  <span>▼</span>
                </button>
                {gameTypeFiltersOpen && gameTypes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                    <div className="p-3">
                      {gameTypes.map(gameType => (
                        <label key={gameType} className="flex items-center gap-2 p-2 hover:bg-slate-600 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedGameTypes.includes(gameType)} onChange={() => toggleGameType(gameType)} className="w-4 h-4" />
                          <span className="text-sm">{gameType}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50 border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Team</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Games Played</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Goals</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Assists</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Chances</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Shots</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Passes</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Miss/Post</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">EV Entries</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Carry-in</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Passing</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Uncontrolled</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Dump-ins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerAnalytics.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="px-4 py-8 text-center text-slate-400">No player data available</td>
                      </tr>
                    ) : (
                      playerAnalytics.map((player, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-blue-400">{player.number}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{player.team}</td>
                          <td className="px-4 py-3 text-right font-semibold text-orange-400">{player.gamesPlayed}</td>
                          <td className="px-4 py-3 text-right font-semibold text-yellow-400">{player.stats.Goals}</td>
                          <td className="px-4 py-3 text-right font-semibold text-cyan-400">{player.stats.Assists}</td>
                          <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Chance Plays']}</td>
                          <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Shots Chances']}</td>
                          <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Pass Chances']}</td>
                          <td className="px-4 py-3 text-right font-semibold">{player.stats['Total Miss + Post']}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Entries']}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Carry-in']}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Passing']}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Uncontrolled']}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-400">{player.stats['EV Dump-ins']}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
