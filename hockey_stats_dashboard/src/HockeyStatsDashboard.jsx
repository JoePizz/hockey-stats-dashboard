import React, { useState, useMemo } from 'react';
import { Upload, BarChart3, Users, Settings } from 'lucide-react';

const HockeyStatsDashboard = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState('game'); // 'game' or 'player'
  const [gameFilter, setGameFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [strengthFilter, setStrengthFilter] = useState('All');

  // Handle CSV upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        return row;
      }).filter(row => row.Game); // Filter out empty rows

      setData(parsedData);
    };
    reader.readAsText(file);
  };

  // Get unique games
  const games = useMemo(() => {
    const unique = [...new Set(data.map(row => row.Game))].sort();
    return unique;
  }, [data]);

  // Get unique teams
  const teams = useMemo(() => {
    const unique = [...new Set(data.map(row => row.Team))].sort();
    return unique;
  }, [data]);

  // Get unique strengths
  const strengths = useMemo(() => {
    const unique = [...new Set(data.map(row => row.Strength).filter(s => s))];
    return unique;
  }, [data]);

  // Calculate chance stats based on formulas
  const calculateChanceStats = (filteredData) => {
    const stats = {
      'Total Chance Plays': 0,
      'Total Shots Chances': 0,
      'Total Pass Chances': 0,
      'Total Miss + Post': 0,
      'EV Entries': 0,
      'EV Carry-in': 0,
      'EV Passing': 0,
      'EV Uncontrolled': 0,
      'EV Dump-ins': 0
    };

    filteredData.forEach(row => {
      const action = row.ACTION?.toUpperCase() || '';
      const danger = row.Danger?.toUpperCase() || '';
      const strength = row.Strength || '';
      const isHighMedDanger = ['HD', 'MD'].includes(danger);

      // Total Chance Plays: HD or MD shots, passes, misses, posts, goals, assists
      if (isHighMedDanger && ['S', 'P', 'M', 'GOAL', 'ASSIST'].includes(action)) {
        if (action === 'POST') {
          stats['Total Chance Plays']++;
        } else if (['S', 'M'].includes(action) || action === 'GOAL' || action === 'ASSIST') {
          stats['Total Chance Plays']++;
        } else if (action === 'P') {
          stats['Total Chance Plays']++;
        }
      }

      // Total Shots Chances: S or GOAL with HD or MD
      if (isHighMedDanger && ['S', 'GOAL'].includes(action)) {
        stats['Total Shots Chances']++;
      }

      // Total Pass Chances: P or ASSIST with HD or MD
      if (isHighMedDanger && ['P', 'ASSIST'].includes(action)) {
        stats['Total Pass Chances']++;
      }

      // Total Miss + Post: M or POST with HD or MD
      if (isHighMedDanger && ['M', 'POST'].includes(action)) {
        stats['Total Miss + Post']++;
      }

      // Entry stats (EV only)
      if (strength === 'EV') {
        if (action === 'CE') stats['EV Carry-in']++;
        if (action === 'PE') stats['EV Passing']++;
        if (action === 'UCE') stats['EV Uncontrolled']++;
        if (action === 'D') stats['EV Dump-ins']++;
        
        // EV Entries = sum of all entry types
        if (['CE', 'PE', 'UCE', 'D'].includes(action)) {
          stats['EV Entries']++;
        }
      }
    });

    return stats;
  };

  // Game Analytics
  const gameAnalytics = useMemo(() => {
    let filtered = data;

    if (gameFilter !== 'All') {
      filtered = filtered.filter(row => row.Game === gameFilter);
    }

    if (strengthFilter !== 'All') {
      filtered = filtered.filter(row => row.Strength === strengthFilter);
    }

    return calculateChanceStats(filtered);
  }, [data, gameFilter, strengthFilter]);

  // Player Analytics
  const playerAnalytics = useMemo(() => {
    let filtered = data;

    if (teamFilter !== 'All') {
      filtered = filtered.filter(row => row.Team === teamFilter);
    }

    if (gameFilter !== 'All') {
      filtered = filtered.filter(row => row.Game === gameFilter);
    }

    if (strengthFilter !== 'All') {
      filtered = filtered.filter(row => row.Strength === strengthFilter);
    }

    // Group by player number
    const playerStats = {};
    filtered.forEach(row => {
      const playerNum = row.Number;
      if (!playerNum) return;

      if (!playerStats[playerNum]) {
        playerStats[playerNum] = {
          number: playerNum,
          team: row.Team,
          stats: {
            'Total Chance Plays': 0,
            'Total Shots Chances': 0,
            'Total Pass Chances': 0,
            'Total Miss + Post': 0,
            'EV Entries': 0,
            'EV Carry-in': 0,
            'EV Passing': 0,
            'EV Uncontrolled': 0,
            'EV Dump-ins': 0
          }
        };
      }

      const action = row.ACTION?.toUpperCase() || '';
      const danger = row.Danger?.toUpperCase() || '';
      const strength = row.Strength || '';
      const isHighMedDanger = ['HD', 'MD'].includes(danger);

      if (isHighMedDanger && ['S', 'P', 'M', 'GOAL', 'ASSIST'].includes(action)) {
        playerStats[playerNum].stats['Total Chance Plays']++;
      }

      if (isHighMedDanger && ['S', 'GOAL'].includes(action)) {
        playerStats[playerNum].stats['Total Shots Chances']++;
      }

      if (isHighMedDanger && ['P', 'ASSIST'].includes(action)) {
        playerStats[playerNum].stats['Total Pass Chances']++;
      }

      if (isHighMedDanger && ['M', 'POST'].includes(action)) {
        playerStats[playerNum].stats['Total Miss + Post']++;
      }

      if (strength === 'EV') {
        if (action === 'CE') playerStats[playerNum].stats['EV Carry-in']++;
        if (action === 'PE') playerStats[playerNum].stats['EV Passing']++;
        if (action === 'UCE') playerStats[playerNum].stats['EV Uncontrolled']++;
        if (action === 'D') playerStats[playerNum].stats['EV Dump-ins']++;
        
        if (['CE', 'PE', 'UCE', 'D'].includes(action)) {
          playerStats[playerNum].stats['EV Entries']++;
        }
      }
    });

    return Object.values(playerStats).sort((a, b) => parseInt(a.number) - parseInt(b.number));
  }, [data, teamFilter, gameFilter, strengthFilter]);

  const StatCard = ({ label, value }) => (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
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

          {/* Tab Navigation */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {data.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-12 bg-slate-800/50 rounded-2xl border border-slate-700">
              <Upload size={48} className="mx-auto mb-4 text-slate-500" />
              <h2 className="text-xl font-bold mb-2">Upload Your CSV</h2>
              <p className="text-slate-400 max-w-md">Export your "All Games" tab from Google Sheets as CSV and upload it to get started</p>
            </div>
          </div>
        ) : currentPage === 'game' ? (
          // Game Analytics Page
          <div>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Game</label>
                <select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>All</option>
                  {games.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Strength</label>
                <select
                  value={strengthFilter}
                  onChange={(e) => setStrengthFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>All</option>
                  {strengths.map(strength => (
                    <option key={strength} value={strength}>{strength}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Chance Plays" value={gameAnalytics['Total Chance Plays']} />
              <StatCard label="Total Shots Chances" value={gameAnalytics['Total Shots Chances']} />
              <StatCard label="Total Pass Chances" value={gameAnalytics['Total Pass Chances']} />
              <StatCard label="Total Miss + Post" value={gameAnalytics['Total Miss + Post']} />
              <StatCard label="EV Entries" value={gameAnalytics['EV Entries']} />
              <StatCard label="EV Carry-in" value={gameAnalytics['EV Carry-in']} />
              <StatCard label="EV Passing" value={gameAnalytics['EV Passing']} />
              <StatCard label="EV Uncontrolled" value={gameAnalytics['EV Uncontrolled']} />
              <StatCard label="EV Dump-ins" value={gameAnalytics['EV Dump-ins']} />
            </div>
          </div>
        ) : (
          // Player Analytics Page
          <div>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Team</label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>All</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Game</label>
                <select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>All</option>
                  {games.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Strength</label>
                <select
                  value={strengthFilter}
                  onChange={(e) => setStrengthFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option>All</option>
                  {strengths.map(strength => (
                    <option key={strength} value={strength}>{strength}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Player Table */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50 border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Team</th>
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
                        <td colSpan="11" className="px-4 py-8 text-center text-slate-400">No player data available</td>
                      </tr>
                    ) : (
                      playerAnalytics.map((player, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-blue-400">{player.number}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{player.team}</td>
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
  );
};

export default HockeyStatsDashboard;
