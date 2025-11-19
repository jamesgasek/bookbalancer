"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var card_1 = require("@/components/ui/card");
var alert_1 = require("@/components/ui/alert");
var table_1 = require("@/components/ui/table");
var switch_1 = require("@/components/ui/switch");
var lucide_react_1 = require("lucide-react");
// === CONFIGURATION ===
var REGIONS = 'us,us2';
var MARKETS = 'h2h,spreads,totals';
function App() {
    var _this = this;
    var _a = (0, react_1.useState)(''), apiKey = _a[0], setApiKey = _a[1];
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)([]), opportunities = _c[0], setOpportunities = _c[1];
    var _d = (0, react_1.useState)(''), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(''), requestsRemaining = _e[0], setRequestsRemaining = _e[1];
    var _f = (0, react_1.useState)(false), useAmericanOdds = _f[0], setUseAmericanOdds = _f[1];
    // === UTILITY FUNCTIONS ===
    function decimalToImpliedProb(decimal) {
        return decimal > 1 ? 1 / decimal : 0;
    }
    function decimalToAmerican(decimal) {
        if (decimal >= 2.0) {
            return '+' + Math.round((decimal - 1) * 100);
        }
        else {
            return Math.round(-100 / (decimal - 1)).toString();
        }
    }
    function formatOdds(decimalOdds) {
        // Extract the decimal odds from "X.XX (Bookmaker)" format
        var match = decimalOdds.match(/^([\d.]+)/);
        if (!match)
            return decimalOdds;
        var decimal = parseFloat(match[1]);
        var bookmaker = decimalOdds.substring(match[0].length);
        if (useAmericanOdds) {
            return decimalToAmerican(decimal) + bookmaker;
        }
        return decimalOdds;
    }
    function fetchAllSportsOdds(key) {
        return __awaiter(this, void 0, void 0, function () {
            var url, params, response, text, data, remaining;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "https://api.the-odds-api.com/v4/sports/upcoming/odds";
                        params = new URLSearchParams({
                            apiKey: key,
                            regions: REGIONS,
                            markets: MARKETS,
                            oddsFormat: 'decimal',
                        });
                        return [4 /*yield*/, fetch("".concat(url, "?").concat(params.toString()))];
                    case 1:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        text = _b.sent();
                        throw new Error("API Error ".concat(response.status, ": ").concat(text));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _b.sent();
                        remaining = (_a = response.headers.get('x-requests-remaining')) !== null && _a !== void 0 ? _a : 'unknown';
                        setRequestsRemaining(remaining);
                        return [2 /*return*/, data];
                }
            });
        });
    }
    function findArbitrage(games) {
        var opps = [];
        for (var _i = 0, games_1 = games; _i < games_1.length; _i++) {
            var game = games_1[_i];
            var marketTypes = ['h2h', 'spreads', 'totals'];
            var _loop_1 = function (marketKey) {
                var bestHomeFavOver = 0;
                var bestAwayUnderdogUnder = 0;
                var bestDraw = 0;
                var bestHomeFavOverBook = '';
                var bestAwayUnderdogUnderBook = '';
                var bestDrawBook = '';
                var outcomesBySide = {};
                for (var _b = 0, _c = game.bookmakers; _b < _c.length; _b++) {
                    var book = _c[_b];
                    var market = book.markets.find(function (m) { return m.key === marketKey; });
                    if (!market)
                        continue;
                    for (var _d = 0, _e = market.outcomes; _d < _e.length; _d++) {
                        var outcome = _e[_d];
                        var name_1 = outcome.name.toLowerCase();
                        var side = void 0;
                        if (marketKey === 'h2h') {
                            if (name_1.includes(game.home_team.toLowerCase())) {
                                side = 'home';
                            }
                            else if (name_1.includes(game.away_team.toLowerCase())) {
                                side = 'away';
                            }
                            else if (name_1.includes('draw') || name_1.includes('tie')) {
                                side = 'draw';
                            }
                            else
                                continue;
                        }
                        else if (marketKey === 'spreads') {
                            if (outcome.point && outcome.point < 0) {
                                side = 'favorite';
                                if (name_1.includes(game.home_team.toLowerCase()) && outcome.point < 0 ||
                                    name_1.includes(game.away_team.toLowerCase()) && outcome.point < 0) {
                                    side = 'favorite';
                                }
                                else if (outcome.point > 0) {
                                    side = 'underdog';
                                }
                                else
                                    continue;
                            }
                            else
                                continue;
                        }
                        else if (marketKey === 'totals') {
                            if (name_1 === 'Over') {
                                side = 'over';
                            }
                            else if (name_1 === 'Under') {
                                side = 'under';
                            }
                            else
                                continue;
                        }
                        else
                            continue;
                        if (marketKey !== 'h2h') {
                            var absPoint = Math.abs(outcome.point || 0);
                            if (!outcomesBySide[absPoint])
                                outcomesBySide[absPoint] = {};
                            if (!outcomesBySide[absPoint][side] || outcome.price > outcomesBySide[absPoint][side].price) {
                                outcomesBySide[absPoint][side] = { price: outcome.price, book: book.title, point: outcome.point };
                            }
                        }
                        else {
                            if (side === 'home' && outcome.price > bestHomeFavOver) {
                                bestHomeFavOver = outcome.price;
                                bestHomeFavOverBook = book.title;
                            }
                            else if (side === 'away' && outcome.price > bestAwayUnderdogUnder) {
                                bestAwayUnderdogUnder = outcome.price;
                                bestAwayUnderdogUnderBook = book.title;
                            }
                            else if (side === 'draw' && outcome.price > bestDraw) {
                                bestDraw = outcome.price;
                                bestDrawBook = book.title;
                            }
                        }
                    }
                }
                if (marketKey === 'h2h') {
                    if (bestHomeFavOver > 1.01 && bestAwayUnderdogUnder > 1.01) {
                        var probHome = decimalToImpliedProb(bestHomeFavOver);
                        var probAway = decimalToImpliedProb(bestAwayUnderdogUnder);
                        var probDraw = decimalToImpliedProb(bestDraw);
                        var totalProb = probHome + probAway + probDraw;
                        if (totalProb > 0 && totalProb < 0.999) {
                            var profitPct = (100 * (1 / totalProb - 1)).toFixed(2);
                            opps.push({
                                Sport: game.sport_title.split(' - ')[0],
                                Game: "".concat(game.away_team, " @ ").concat(game.home_team),
                                Market: 'Moneyline (h2h)',
                                Time: new Date(game.commence_time).toLocaleString(),
                                Home: "".concat(bestHomeFavOver.toFixed(2), " (").concat(bestHomeFavOverBook || 'N/A', ")"),
                                Away: "".concat(bestAwayUnderdogUnder.toFixed(2), " (").concat(bestAwayUnderdogUnderBook || 'N/A', ")"),
                                Draw: bestDraw > 1 ? "".concat(bestDraw.toFixed(2), " (").concat(bestDrawBook || 'N/A', ")") : 'N/A',
                                Profit: "".concat(profitPct, "%"),
                            });
                        }
                    }
                }
                else {
                    for (var absPoint in outcomesBySide) {
                        var sides = outcomesBySide[absPoint];
                        var side1 = marketKey === 'spreads' ? 'favorite' : 'over';
                        var side2 = marketKey === 'spreads' ? 'underdog' : 'under';
                        if (sides[side1] && sides[side2]) {
                            var price1 = sides[side1].price;
                            var price2 = sides[side2].price;
                            var prob1 = decimalToImpliedProb(price1);
                            var prob2 = decimalToImpliedProb(price2);
                            var totalProb = prob1 + prob2;
                            if (totalProb < 0.999) {
                                var profitPct = (100 * (1 / totalProb - 1)).toFixed(2);
                                var opp = {
                                    Sport: game.sport_title.split(' - ')[0],
                                    Game: "".concat(game.away_team, " @ ").concat(game.home_team),
                                    Market: marketKey.charAt(0).toUpperCase() + marketKey.slice(1) + " at ".concat(absPoint),
                                    Time: new Date(game.commence_time).toLocaleString(),
                                    Draw: 'N/A',
                                    Profit: "".concat(profitPct, "%"),
                                };
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                opp[side1.charAt(0).toUpperCase() + side1.slice(1)] = "".concat(price1.toFixed(2), " (").concat(sides[side1].book || 'N/A', ")");
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                opp[side2.charAt(0).toUpperCase() + side2.slice(1)] = "".concat(price2.toFixed(2), " (").concat(sides[side2].book || 'N/A', ")");
                                opps.push(opp);
                            }
                        }
                    }
                }
            };
            for (var _a = 0, marketTypes_1 = marketTypes; _a < marketTypes_1.length; _a++) {
                var marketKey = marketTypes_1[_a];
                _loop_1(marketKey);
            }
        }
        opps.sort(function (a, b) { return parseFloat(b.Profit) - parseFloat(a.Profit); });
        return opps;
    }
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var games, arbs, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!apiKey.trim()) {
                        setError('Please enter an API key');
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError('');
                    setOpportunities([]);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetchAllSportsOdds(apiKey)];
                case 2:
                    games = _a.sent();
                    arbs = findArbitrage(games);
                    setOpportunities(arbs);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<>
      <div className="fixed bottom-4 left-4 z-50">
        <card_1.Card className="p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Decimal</span>
            <switch_1.Switch checked={useAmericanOdds} onCheckedChange={setUseAmericanOdds}/>
            <span className="text-xs font-medium">American</span>
          </div>
        </card_1.Card>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <card_1.Card className="shadow-2xl">
        <card_1.CardHeader className="text-center space-y-2">
          <card_1.CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Sportsbook Arbitrage Finder
          </card_1.CardTitle>
          <card_1.CardDescription className="text-base">
            Find profitable arbitrage opportunities across sports betting markets
          </card_1.CardDescription>
        </card_1.CardHeader>
        
        <card_1.CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input_1.Input type="text" value={apiKey} onChange={function (e) { return setApiKey(e.target.value); }} placeholder="Enter your API key from the-odds-api.com" className="flex-1"/>
              <button_1.Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900">
                {loading ? 'Scanning...' : 'Find Arbitrage'}
              </button_1.Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Don't have an API key?</span>
              <a href="https://the-odds-api.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium hover:underline">
                Subscribe at the-odds-api.com
                <lucide_react_1.ExternalLink className="h-3 w-3"/>
              </a>
            </div>
          </form>

          {requestsRemaining && (<p className="text-center text-sm text-muted-foreground">
              Requests remaining this month: <span className="font-semibold">{requestsRemaining}</span>
            </p>)}

          {error && (<alert_1.Alert variant="destructive">
              <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
            </alert_1.Alert>)}

          {loading && (<div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-lg font-medium text-purple-600">
                Scanning all sports for arbitrage opportunities...
              </p>
            </div>)}

          {!loading && opportunities.length > 0 && (<div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600">
                  🎯 {opportunities.length} Arbitrage Opportunity(ies) Found!
                </h2>
              </div>
              
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table_1.Table>
                    <table_1.TableHeader>
                      <table_1.TableRow className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-600 hover:to-purple-800">
                        <table_1.TableHead className="text-white font-semibold">Sport</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Game</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Market</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Time</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Home/Favorite/Over</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Away/Underdog/Under</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Draw</table_1.TableHead>
                        <table_1.TableHead className="text-white font-semibold">Profit</table_1.TableHead>
                      </table_1.TableRow>
                    </table_1.TableHeader>
                    <table_1.TableBody>
                      {opportunities.map(function (opp, idx) { return (<table_1.TableRow key={idx} className="hover:bg-purple-50">
                          <table_1.TableCell className="font-medium">{opp.Sport}</table_1.TableCell>
                          <table_1.TableCell>{opp.Game}</table_1.TableCell>
                          <table_1.TableCell>{opp.Market}</table_1.TableCell>
                          <table_1.TableCell className="text-sm">{opp.Time}</table_1.TableCell>
                          <table_1.TableCell>{formatOdds(opp.Home || opp.Favorite || opp.Over || 'N/A')}</table_1.TableCell>
                          <table_1.TableCell>{formatOdds(opp.Away || opp.Underdog || opp.Under || 'N/A')}</table_1.TableCell>
                          <table_1.TableCell>{opp.Draw && opp.Draw !== 'N/A' ? formatOdds(opp.Draw) : 'N/A'}</table_1.TableCell>
                          <table_1.TableCell className="font-bold text-green-600">{opp.Profit}</table_1.TableCell>
                        </table_1.TableRow>); })}
                    </table_1.TableBody>
                  </table_1.Table>
                </div>
              </div>
            </div>)}

          {!loading && opportunities.length === 0 && apiKey && !error && requestsRemaining && (<div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No arbitrage opportunities right now — lines are sharp today!</p>
              <p className="mt-2">Run again in a few minutes; odds change constantly.</p>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>
    </>);
}
exports.default = App;
