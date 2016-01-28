let React = require('react');
let _ = require("lodash");

let Paginate = require("react-paginate");

let FluxMixin = require("fluxxor/lib/flux_mixin")(React);
let StoreWatchMixin = require("fluxxor/lib/store_watch_mixin");

let Navigation = require("react-router/lib/Navigation");
let Link = require("react-router/lib/components/Link");

let constants = require("../../libs/constants");

let MarketRow = require("./MarketRow");

let MarketsPage = React.createClass({

    // assuming only one branch and all markets in store are of that branch
    mixins: [FluxMixin, StoreWatchMixin('market', 'search', 'branch', 'config'), Navigation],

    getInitialState() {
        return {
            marketsPerPage: constants.MARKETS_PER_PAGE,
            visiblePages: 3,
            pageNum: this.props.params.page ? this.props.params.page - 1 : 0
        };
    },

    getStateFromFlux: function () {
        var flux = this.getFlux();
        var marketState = flux.store('market').getState();
        var searchState = flux.store('search').getState();
        var currentBranch = flux.store('branch').getCurrentBranch();
        var account = flux.store('config').getAccount();

        return {
            searchKeywords: searchState.keywords,
            markets: searchState.results,
            pendingMarkets: marketState.pendingMarkets,
            currentBranch: currentBranch,
            account: account
        }
    },

    handlePageChanged: function (data) {
        this.transitionTo('marketsPage', {page: (parseInt(data.selected) + 1)});
        this.setState({pageNum: data.selected});
    },

    onChangeSearchInput: function (event) {
        this.setState({searchKeywords: event.target.value});
        this.debounceSearchInput(event.target.value);
    },

    onChangeSortBy: function (event) {
        this.handlePageChanged({selected: 0});
        var sortInput = event.target.value.split('|');
        this.getFlux().actions.search.sortMarkets(sortInput[0], parseInt(sortInput[1]));
    },

    debounceSearchInput: _.debounce(function (val) {
        this.handlePageChanged({selected: 0});
        this.getFlux().actions.search.updateKeywords(val);
    }, 500),

    componentDidMount() {
        this.stylesheetEl = document.createElement("link");
        this.stylesheetEl.setAttribute("rel", "stylesheet");
        this.stylesheetEl.setAttribute("type", "text/css");
        this.stylesheetEl.setAttribute("href", "/css/markets.css");
        document.getElementsByTagName("head")[0].appendChild(this.stylesheetEl);
    },
    componentWillUnmount() {
        this.stylesheetEl.remove();
    },

    render() {
        let market = this.props.market;

        let start = this.state.pageNum * this.state.marketsPerPage;
        let total = _.size(this.state.markets);
        let end = start + this.state.marketsPerPage;
        end = end > total ? total : end;
        let markets = _.map(this.state.markets).slice(start, end);

        return (
            <div className="marketsPage">
                <link rel="stylesheet" href="/css/markets.css" />
                <h1>Markets</h1>

                <div className="row submenu">
                    <a className="collapsed" data-toggle="collapse" href="#collapseSubmenu"
                       aria-expanded="false"
                       aria-controls="collapseSubmenu">
                        <h2>Navigation</h2>
                    </a>

                    <div id="collapseSubmenu" className="col-xs-12 collapse" aria-expanded="false">
                        <ul className="list-group" role="tablist" id="tabpanel">
                            <li role="presentation" className="list-group-item">
                                <Link to='markets' role="tab">
                                    Open Markets
                                </Link>
                            </li>
                            <li role="presentation" className="list-group-item">
                                <Link to="markets_expired" role="tab">
                                    Expired Markets
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="row" style={{paddingTop: "8px", paddingBottom: "8px"}}>
                    <div className="pull-left col-sm-4">
                        <select onChange={this.onChangeSortBy}>
                            <option selected disabled>Sort markets</option>
                            <option value="creationBlock|1">Creation date (newest first)</option>
                            <option value="creationBlock|0">Creation date (oldest first)</option>
                            <option value="endBlock|0">End date (soonest first)</option>
                            <option value="endBlock|1">End date (farthest first)</option>
                            <option value="description|0">Description</option>
                        </select>
                    </div>
                    <div className="pull-right col-sm-4">
                        <input type="search"
                               className="form-control markets-search-input"
                               value={ this.state.searchKeywords }
                               placeholder="Search"
                               tabIndex="0"
                               onChange={ this.onChangeSearchInput }/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        {markets.map(market => {
                            return <MarketRow key={market.id} market={market} />;
                        })}
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <span className='showing'>Showing { start + 1 } - { end } of { total }</span>
                        <Paginate
                            previousLabel={ <i className='fa fa-chevron-left'></i> }
                            nextLabel={ <i className='fa fa-chevron-right'></i> }
                            breakLabel={ <li className="break"><a href="">...</a></li> }
                            pageNum={ total / this.state.marketsPerPage }
                            marginPagesDisplayed={ 2 }
                            pageRangeDisplayed={ 5 }
                            forceSelected={ this.state.pageNum }
                            clickCallback={ this.handlePageChanged }
                            containerClassName={ 'paginator' }
                            subContainerClassName={ 'pages' }
                            activeClass={ 'active' }
                            />
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = MarketsPage;