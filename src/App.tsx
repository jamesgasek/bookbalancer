import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ExternalLink } from 'lucide-react';

// === TYPES ===
interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  title: string;
  markets: Market[];
}

interface Game {
  id: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface ArbitrageOpportunity {
  Sport: string;
  Game: string;
  Market: string;
  Time: string;
  Home?: string;
  Away?: string;
  Draw?: string;
  Favorite?: string;
  Underdog?: string;
  Over?: string;
  Under?: string;
  Profit: string;
}

// === CONFIGURATION ===
const REGIONS = 'us,us2';
const MARKETS = 'h2h,spreads,totals';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [error, setError] = useState('');
  const [requestsRemaining, setRequestsRemaining] = useState<string>('');
  const [useAmericanOdds, setUseAmericanOdds] = useState(false);

  // === URL PARAMETER HANDLING ===
  useEffect(() => {
    // Check for apiKey URL parameter on component mount
    const params = new URLSearchParams(window.location.search);
    const urlApiKey = params.get('apiKey');
    const shouldAutoLoad = params.get('autoLoad') === 'true';
    
    if (urlApiKey) {
      setApiKey(urlApiKey);
      
      // If autoLoad parameter is present, automatically fetch opportunities
      if (shouldAutoLoad) {
        // Wait a tick to ensure state is updated
        setTimeout(async () => {
          setLoading(true);
          setError('');
          setOpportunities([]);
          
          try {
            const games = await fetchAllSportsOdds(urlApiKey);
            const arbs = findArbitrage(games);
            setOpportunities(arbs);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        }, 0);
      }
    }
  }, []);

  // === UTILITY FUNCTIONS ===
  function decimalToImpliedProb(decimal: number): number {
    return decimal > 1 ? 1 / decimal : 0;
  }

  function decimalToAmerican(decimal: number): string {
    if (decimal >= 2.0) {
      return '+' + Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1)).toString();
    }
  }

  function formatOdds(decimalOdds: string): string {
    // Extract the decimal odds from "X.XX (Bookmaker)" format
    const match = decimalOdds.match(/^([\d.]+)/);
    if (!match) return decimalOdds;
    
    const decimal = parseFloat(match[1]);
    const bookmaker = decimalOdds.substring(match[0].length);
    
    if (useAmericanOdds) {
      return decimalToAmerican(decimal) + bookmaker;
    }
    return decimalOdds;
  }

  async function fetchAllSportsOdds(key: string): Promise<Game[]> {
    const url = `https://api.the-odds-api.com/v4/sports/upcoming/odds`;
    
    const params = new URLSearchParams({
      apiKey: key,
      regions: REGIONS,
      markets: MARKETS,
      oddsFormat: 'decimal',
    });

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    const data = await response.json() as Game[];
    const remaining = response.headers.get('x-requests-remaining') ?? 'unknown';
    setRequestsRemaining(remaining);
    
    return data;
  }

  function findArbitrage(games: Game[]): ArbitrageOpportunity[] {
    const opps: ArbitrageOpportunity[] = [];

    for (const game of games) {
      const marketTypes = ['h2h', 'spreads', 'totals'];

      for (const marketKey of marketTypes) {
        let bestHomeFavOver = 0;
        let bestAwayUnderdogUnder = 0;
        let bestDraw = 0;
        let bestHomeFavOverBook = '';
        let bestAwayUnderdogUnderBook = '';
        let bestDrawBook = '';
        const outcomesBySide: { [key: string]: { [key: string]: { price: number; book: string; point?: number } } } = {};

        for (const book of game.bookmakers) {
          const market = book.markets.find(m => m.key === marketKey);
          if (!market) continue;

          for (const outcome of market.outcomes) {
            const name = outcome.name.toLowerCase();
            let side: string;

            if (marketKey === 'h2h') {
              if (name.includes(game.home_team.toLowerCase())) {
                side = 'home';
              } else if (name.includes(game.away_team.toLowerCase())) {
                side = 'away';
              } else if (name.includes('draw') || name.includes('tie')) {
                side = 'draw';
              } else continue;
            } else if (marketKey === 'spreads') {
              if (outcome.point && outcome.point < 0) {
                side = 'favorite';
                if (name.includes(game.home_team.toLowerCase()) && outcome.point < 0 ||
                    name.includes(game.away_team.toLowerCase()) && outcome.point < 0) {
                  side = 'favorite';
                } else if (outcome.point > 0) {
                  side = 'underdog';
                } else continue;
              } else continue;
            } else if (marketKey === 'totals') {
              if (name === 'Over') {
                side = 'over';
              } else if (name === 'Under') {
                side = 'under';
              } else continue;
            } else continue;

            if (marketKey !== 'h2h') {
              const absPoint = Math.abs(outcome.point || 0);
              if (!outcomesBySide[absPoint]) outcomesBySide[absPoint] = {};
              if (!outcomesBySide[absPoint][side] || outcome.price > outcomesBySide[absPoint][side].price) {
                outcomesBySide[absPoint][side] = { price: outcome.price, book: book.title, point: outcome.point };
              }
            } else {
              if (side === 'home' && outcome.price > bestHomeFavOver) {
                bestHomeFavOver = outcome.price;
                bestHomeFavOverBook = book.title;
              } else if (side === 'away' && outcome.price > bestAwayUnderdogUnder) {
                bestAwayUnderdogUnder = outcome.price;
                bestAwayUnderdogUnderBook = book.title;
              } else if (side === 'draw' && outcome.price > bestDraw) {
                bestDraw = outcome.price;
                bestDrawBook = book.title;
              }
            }
          }
        }

        if (marketKey === 'h2h') {
          if (bestHomeFavOver > 1.01 && bestAwayUnderdogUnder > 1.01) {
            const probHome = decimalToImpliedProb(bestHomeFavOver);
            const probAway = decimalToImpliedProb(bestAwayUnderdogUnder);
            const probDraw = decimalToImpliedProb(bestDraw);
            const totalProb = probHome + probAway + probDraw;
            
            if (totalProb > 0 && totalProb < 0.999) {
              const profitPct = (100 * (1 / totalProb - 1)).toFixed(2);
              opps.push({
                Sport: game.sport_title.split(' - ')[0],
                Game: `${game.away_team} @ ${game.home_team}`,
                Market: 'Moneyline (h2h)',
                Time: new Date(game.commence_time).toLocaleString(),
                Home: `${bestHomeFavOver.toFixed(2)} (${bestHomeFavOverBook || 'N/A'})`,
                Away: `${bestAwayUnderdogUnder.toFixed(2)} (${bestAwayUnderdogUnderBook || 'N/A'})`,
                Draw: bestDraw > 1 ? `${bestDraw.toFixed(2)} (${bestDrawBook || 'N/A'})` : 'N/A',
                Profit: `${profitPct}%`,
              });
            }
          }
        } else {
          for (const absPoint in outcomesBySide) {
            const sides = outcomesBySide[absPoint];
            const side1 = marketKey === 'spreads' ? 'favorite' : 'over';
            const side2 = marketKey === 'spreads' ? 'underdog' : 'under';
            if (sides[side1] && sides[side2]) {
              const price1 = sides[side1].price;
              const price2 = sides[side2].price;
              const prob1 = decimalToImpliedProb(price1);
              const prob2 = decimalToImpliedProb(price2);
              const totalProb = prob1 + prob2;
              if (totalProb < 0.999) {
                const profitPct = (100 * (1 / totalProb - 1)).toFixed(2);
                const opp: ArbitrageOpportunity = {
                  Sport: game.sport_title.split(' - ')[0],
                  Game: `${game.away_team} @ ${game.home_team}`,
                  Market: marketKey.charAt(0).toUpperCase() + marketKey.slice(1) + ` at ${absPoint}`,
                  Time: new Date(game.commence_time).toLocaleString(),
                  Draw: 'N/A',
                  Profit: `${profitPct}%`,
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (opp as any)[side1.charAt(0).toUpperCase() + side1.slice(1)] = `${price1.toFixed(2)} (${sides[side1].book || 'N/A'})`;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (opp as any)[side2.charAt(0).toUpperCase() + side2.slice(1)] = `${price2.toFixed(2)} (${sides[side2].book || 'N/A'})`;
                opps.push(opp);
              }
            }
          }
        }
      }
    }

    opps.sort((a, b) => parseFloat(b.Profit) - parseFloat(a.Profit));
    return opps;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError('');
    setOpportunities([]);
    
    try {
      const games = await fetchAllSportsOdds(apiKey);
      const arbs = findArbitrage(games);
      setOpportunities(arbs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <Card className="p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Decimal</span>
            <Switch
              checked={useAmericanOdds}
              onCheckedChange={setUseAmericanOdds}
            />
            <span className="text-xs font-medium">American</span>
          </div>
        </Card>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <Card className="shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Bookbalancer Arbitrage Finder
          </CardTitle>
          <CardDescription className="text-base">
            Find profitable arbitrage opportunities across sports betting markets
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key from the-odds-api.com"
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
              >
                {loading ? 'Scanning...' : 'Find Arbitrage'}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Don't have an API key?</span>
              <a 
                href="https://the-odds-api.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium hover:underline"
              >
                Subscribe at the-odds-api.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </form>

          {requestsRemaining && (
            <p className="text-center text-sm text-muted-foreground">
              Requests remaining this month: <span className="font-semibold">{requestsRemaining}</span>
            </p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-lg font-medium text-purple-600">
                Scanning all sports for arbitrage opportunities...
              </p>
            </div>
          )}

          {!loading && opportunities.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600">
                  🎯 {opportunities.length} Arbitrage {opportunities.length === 1 ? 'Opportunity' : 'Opportunities'} Found!
                </h2>
              </div>
              
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-600 hover:to-purple-800">
                        <TableHead className="text-white font-semibold">Sport</TableHead>
                        <TableHead className="text-white font-semibold">Game</TableHead>
                        <TableHead className="text-white font-semibold">Market</TableHead>
                        <TableHead className="text-white font-semibold">Time</TableHead>
                        <TableHead className="text-white font-semibold">Home/Favorite/Over</TableHead>
                        <TableHead className="text-white font-semibold">Away/Underdog/Under</TableHead>
                        <TableHead className="text-white font-semibold">Draw</TableHead>
                        <TableHead className="text-white font-semibold">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunities.map((opp, idx) => (
                        <TableRow key={idx} className="hover:bg-purple-50">
                          <TableCell className="font-medium">{opp.Sport}</TableCell>
                          <TableCell>{opp.Game}</TableCell>
                          <TableCell>{opp.Market}</TableCell>
                          <TableCell className="text-sm">{opp.Time}</TableCell>
                          <TableCell>{formatOdds(opp.Home || opp.Favorite || opp.Over || 'N/A')}</TableCell>
                          <TableCell>{formatOdds(opp.Away || opp.Underdog || opp.Under || 'N/A')}</TableCell>
                          <TableCell>{opp.Draw && opp.Draw !== 'N/A' ? formatOdds(opp.Draw) : 'N/A'}</TableCell>
                          <TableCell className="font-bold text-green-600">{opp.Profit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {!loading && opportunities.length === 0 && apiKey && !error && requestsRemaining && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No arbitrage opportunities right now — lines are sharp today!</p>
              <p className="mt-2">Run again in a few minutes; odds change constantly.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}

export default App;
