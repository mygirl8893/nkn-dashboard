getBalance = function() {
    let nknPrice
    axios.get('https://price.nknx.org/price?quote=NKN&currency=USD')
        .then(response => {
            nknPrice = response.data[0].prices[0].price.toFixed(3)
        })

    nknWallet.configure({
        rpcAddr: 'http://testnet-seed-0008.nkn.org:30003/',
    });
    let walletFromJson = "";
    let lines = `{"Version":"0.0.1","PasswordHash":"be2ef4971b24405df0541f95fe6158ac661e69971337ff7260b219d1056ebc3b","MasterKey":"cb6624d3be4b23ba9fb9ed746595817ebc0e63a44772175a638548ca264a329f","IV":"2a18decef1149b47fc9f50965b055b2b","PrivateKeyEncrypted":"5158f5e75067629c963524f30e62df14cc3cbf37422f72e23c2fce9b303d11af","Address":"NcNRJJZoQBpEZhFfHM5Gjrzc9bSK6kda7u","ProgramHash":"b482a02031a097da723e8121b54bfe6671b9e576","ContractData":"232103b9b80d4d3d25bc7719fe7a45aa283346488988179bbc1852d705ef470930cb74ac0100b482a02031a097da723e8121b54bfe6671b9e576"}`
    let p = `test`;
    let updatedBalance = 0
    walletFromJson = nknWallet.loadJsonWallet(lines, p);
    let result = $('#wallet').val()
    walletFromJson.address = result;
    walletFromJson.queryAssetBalance().then(function(value) {
        updatedBalance = value.toString()
        updatedBalanceUsd = updatedBalance * nknPrice / 5
        $('.walletData').addClass('active')
        $('.walletBalance').text(updatedBalance)
        $('.walletBalanceUsd').text('$' + updatedBalanceUsd.toFixed(2))
    }).catch(function(error) {
        $('.walletData').addClass('active')
        $('.walletBalance').text(error)
        $('.walletBalanceUsd').text(error)
    });
}

"use strict"

Vue.use(VueMaterial.default);

let app = new Vue({

    data() {
        return {
            // ADD YOUR NODES' IP INTO ARRAY BELOW
            nodes: [
                '193.9.60.218',
                '35.244.20.200'
            ],
            // ADD YOUR WALLETS ADDRESSES HERE
            wallets: [{
                    "label": "lightmyfire",
                    "address": "NhWjY9iwD5Ad8DafiEWbTo4buLpBomdttH",
                    "balance": null,
                    "balanceUsd": null,
                    "preview": ""
                },
                {
                    "label": "Ebudka",
                    "address": "NVKDBKYAJ55pXJSNj3TNFYaeZDGa8mT9V3",
                    "balance": null,
                    "balanceUsd": null,
                    "preview": ""
                }
            ],
            refreshTime: "60",
            activeItem: 'wallet',
            nknPrice: 'Loading...',
            userNodes: 1,
            totalNodes: 1,
            blocktime: 20,
            nodeTime: 1,
            testTokensDaily: 0,
            totalTestTokens: 0,
            totalMainTokens: 0,
            usdProfitPerDay: 0,
            bandWidthCost: 0,
            latestTiming: '',
            nodeCost: 0,
            usdProfit: 0,
            isLoading: true,
            nodesData: [],
            latestBlock: 'Loading...',
            allNodes: '',
            latestBlocks: [],
            balance: 0,
            nodesLength: null,
            wallet: '',
            tweets: [],
            showing: 0,
            blockCounter: 0,
            walletAddress: '',
            walletBalanceUsd: 0,
            nknCap: 0,
            nknVolume: 0,
            nknRank: 0,
            nkn24: 0,
            relayedMessages: 0,
            crawlCounter: 'Loading...',
            nknWeekly: 0,
            seedVersion: '',
            time: '',
            timer: '',
            miners: [],
            currentOrder: 'default',
            refreshActive: {
                title: 'Enable',
                active: false
            },
            nodesDataCounter: {
                all: 0,
                pf: 0,
                ss: 0,
                sf: 0,
                ws: 0,
                er: 0
            }
        }
    },
    created() {
        this.nodesLength = this.nodes.length
        this.loadData()
    },
    mounted() {
        this.fetch();
        setInterval(this.rotate, 6000);
    },
    updated() {
        this.testnetCalc()
    },
    computed: {
        sortedArray: function() {
            let customNodes = []
            if (this.currentOrder === 'default') {
                function compare(a, b) {
                    if (a.syncState < b.syncState)
                        return -1;
                    if (a.syncState > b.syncState)
                        return 1;
                    return 0;
                }
                return this.nodesData.sort(compare);
            } else {
                for (i = 0; i < this.nodesData.length; i++) {
                    if (this.nodesData[i].syncState === this.currentOrder) {
                        customNodes.push(this.nodesData[i])
                    }
                }
                return customNodes
            }
        },
        sortedMiners: function() {
            function compare(a, b) {
                if (a.height > b.height)
                    return -1;
                if (a.height < b.height)
                    return 1;
                return 0;
            }
            return this.miners.sort(compare);
        }
    },
    methods: {
        //Preloader spinner and data render
        preload: function() {
            this.isLoading = true
            if (this.nodes.length === this.nodesData.length) {
                this.getNodesCount()
                this.getMiners()
                this.getNodesDataCounter()
                this.getLatestBlock()
                this.getSeedNodeState()
                this.getPrice()
                this.getWalletsBalance()
                setTimeout(() => {
                    this.isLoading = false
                }, 1500)

            } else {
                setTimeout(() => {
                    this.preload()
                }, 1000)
            }

        },
        //Refresh button
        refreshToggle: function() {
            clearInterval(this.timer)
            this.refreshActive.active = !this.refreshActive.active
            if (this.refreshActive.title === 'Enable') {

                this.refreshActive.title = 'Disable'
            } else {
                this.refreshActive.title = 'Enable'
            }
            this.timer = setInterval(this.autoRefresh, this.refreshTime * 1000);
        },
        //Auto Refresh trigger
        autoRefresh: function() {
            if (this.refreshActive.active === true) {
                this.loadData()
            }
        },

        //Get wallets balance from array
        getWalletsBalance: function() {
            const self = this;
            nknWallet.configure({
                rpcAddr: 'http://testnet-seed-0008.nkn.org:30003/',
            });
            let walletFromJson = "";
            let lines = `{"Version":"0.0.1","PasswordHash":"be2ef4971b24405df0541f95fe6158ac661e69971337ff7260b219d1056ebc3b","MasterKey":"cb6624d3be4b23ba9fb9ed746595817ebc0e63a44772175a638548ca264a329f","IV":"2a18decef1149b47fc9f50965b055b2b","PrivateKeyEncrypted":"5158f5e75067629c963524f30e62df14cc3cbf37422f72e23c2fce9b303d11af","Address":"NcNRJJZoQBpEZhFfHM5Gjrzc9bSK6kda7u","ProgramHash":"b482a02031a097da723e8121b54bfe6671b9e576","ContractData":"232103b9b80d4d3d25bc7719fe7a45aa283346488988179bbc1852d705ef470930cb74ac0100b482a02031a097da723e8121b54bfe6671b9e576"}`
            let p = `test`;
            let updatedBalance = 0
            walletFromJson = nknWallet.loadJsonWallet(lines, p);

            for (let i = 0; i < self.wallets.length; i++) {
                self.wallets[i].preview = self.wallets[i].label.charAt(0)
                walletFromJson.address = self.wallets[i].address;
                walletFromJson.queryAssetBalance().then(function(value) {
                    self.wallets[i].balance = value.toString();
                    self.wallets[i].balanceUsd = (self.wallets[i].balance * self.nknPrice / 5).toFixed(0)
                }).catch(function(error) {
                    self.wallets[i].balance = 'query balance fail'
                })
            }
        },
        //Get current node count in NKN network
        getNodesCount: function() {
            axios.get('https://api.nknx.org/crawledNodes', {

                })
                .then((response) => {
                    this.crawlCounter = response.data.length
                })
            if (this.crawlCounter != 'Loading...') {
                this.totalNodes = this.crawlCounter
            } else {
                this.totalNodes = 1
            }
        },
        //Get mempool, status, version of seed node
        getSeedNodeState: function() {
            axios.post('http://testnet-seed-0008.nkn.org:30003/', {
                    "jsonrpc": "2.0",
                    "method": "getnodestate",
                    "params": {},
                    "id": 1
                })
                .then((response) => {
                    this.seedStatus = response.data.result.syncState
                    this.relayedMessages = response.data.result.relayMessageCount
                })
                .catch((error) => {});

            axios.post('http://testnet-seed-0008.nkn.org:30003/', {
                    "jsonrpc": "2.0",
                    "method": "getversion",
                    "params": {},
                    "id": 1
                })
                .then((response) => {
                    this.seedVersion = response.data.result

                })
                .catch((error) => {});
        },
        //Get NKN price data
        getPrice: function() {
            axios.get('https://price.nknx.org/price?quote=NKN&currency=USD')
                .then(response => {
                    this.nknPrice = response.data[0].prices[0].price.toFixed(3)
                    this.nknRank = response.data[0].cmc_rank
                    this.nknCap = (response.data[0].prices[0].market_cap / 1000000).toFixed(2)
                    this.nknVolume = ((response.data[0].prices[0].volume_24h) / 1000000).toFixed(2)
                    this.nkn24 = response.data[0].prices[0].percent_change_24h.toFixed(2)
                    this.nknWeekly = response.data[0].prices[0].percent_change_7d.toFixed(2)
                })
        },
        //Get data for user nodes and latest seed node block || Nodes page.
        loadData: function() {
            this.userNodes = this.nodesLength
            this.nodesData = []
            this.latestBlocks = []

            axios.post('http://testnet-seed-0008.nkn.org:30003/', {
                    "jsonrpc": "2.0",
                    "method": "getlatestblockheight",
                    "params": {},
                    "id": 1
                })
                .then((response) => {
                    this.latestBlock = response.data.result
                    this.blockCounter = response.data.result

                })
                .catch((error) => {});

            for (let i = 0; i < this.nodesLength; i++) {
                axios.post('http://' + this.nodes[i] + ':30003/', {
                        "jsonrpc": "2.0",
                        "method": "getnodestate",
                        "params": {},
                        "id": 1
                    })
                    .then((response) => {
                        this.nodesData.push(response.data.result)
                    })
                    .catch((error) => {
                        this.nodesData.push({
                            'addr': this.nodes[i],
                            'syncState': 'Error'
                        })

                    })

            }

            //Start preload function
            this.preload()
        },
        //Get latest Blocks of Seed Node || Blocks page.
        getLatestBlock: function() {
            axios.post('http://testnet-seed-0008.nkn.org:30003/', {
                    "jsonrpc": "2.0",
                    "method": "getblock",
                    "params": {
                        "height": this.latestBlock
                    },
                    "id": 1
                })
                .then((response) => {
                    let timestamp = response.data.result.header.timestamp * 1000
                    let previous = new Date(timestamp)
                    let current = new Date()
                    let msPerMinute = 60 * 1000;
                    let msPerHour = msPerMinute * 60;
                    let msPerDay = msPerHour * 24;
                    let msPerMonth = msPerDay * 30;
                    let msPerYear = msPerDay * 365;
                    let blockStamp = ''
                    let elapsed = current - previous;

                    if (elapsed < msPerMinute) {
                        blockStamp = Math.round(elapsed / 1000) + ' seconds ago';
                    } else if (elapsed < msPerHour) {
                        blockStamp = Math.round(elapsed / msPerMinute) + ' minutes ago';
                    } else if (elapsed < msPerDay) {
                        blockStamp = Math.round(elapsed / msPerHour) + ' hours ago';
                    } else if (elapsed < msPerMonth) {
                        blockStamp = 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago';
                    } else if (elapsed < msPerYear) {
                        blockStamp = 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago';
                    } else {
                        blockStamp = 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
                    }

                    this.latestTiming = blockStamp
                })
        },
        //Get coounters of user nodes states || Nodes page.
        getNodesDataCounter: function() {
            this.nodesDataCounter.pf = 0
            this.nodesDataCounter.sf = 0
            this.nodesDataCounter.ss = 0
            this.nodesDataCounter.er = 0
            this.nodesDataCounter.ws = 0
            this.nodesDataCounter.all = this.nodesData.length

            for (let i in this.nodesData) {
                switch (this.nodesData[i].syncState) {
                    case 'PersistFinished':
                        this.nodesDataCounter.pf++
                        break;
                    case 'SyncFinished':
                        this.nodesDataCounter.sf++
                        break;
                    case 'SyncStarted':
                        this.nodesDataCounter.ss++
                        break;
                    case 'WaitForSyncing':
                        this.nodesDataCounter.ws++
                        break;
                    case 'Error':
                        this.nodesDataCounter.er++
                        break;
                }
            }
        },
        //Get Block History data || Blocks page.
        getMiners: function() {
            this.blockCounter = this.latestBlock
            this.miners = []
            for (let i = 0; i < 20; i++) {

                axios.post('http://testnet-seed-0008.nkn.org:30003/', {
                        "jsonrpc": "2.0",
                        "method": "getblock",
                        "params": {
                            "height": this.blockCounter
                        },
                        "id": 1
                    })
                    .then((response) => {
                        let timestamp = response.data.result.header.timestamp * 1000
                        let previous = new Date(timestamp)
                        let current = new Date()
                        let msPerMinute = 60 * 1000;
                        let msPerHour = msPerMinute * 60;
                        let msPerDay = msPerHour * 24;
                        let msPerMonth = msPerDay * 30;
                        let msPerYear = msPerDay * 365;
                        let blockStamp = ''
                        let elapsed = current - previous;

                        if (elapsed < msPerMinute) {
                            blockStamp = Math.round(elapsed / 1000) + ' seconds ago';
                        } else if (elapsed < msPerHour) {
                            blockStamp = Math.round(elapsed / msPerMinute) + ' minutes ago';
                        } else if (elapsed < msPerDay) {
                            blockStamp = Math.round(elapsed / msPerHour) + ' hours ago';
                        } else if (elapsed < msPerMonth) {
                            blockStamp = 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago';
                        } else if (elapsed < msPerYear) {
                            blockStamp = 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago';
                        } else {
                            blockStamp = 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
                        }

                        this.miners.push({
                            'height': response.data.result.header.height,
                            'time': blockStamp,
                            'tx': response.data.result.transactions.length,
                            'reward': response.data.result.transactions[0].outputs[0].value,
                            'miner': response.data.result.transactions[0].outputs[0].address
                        })

                    })
                this.blockCounter--
            }

        },
        //Calculator.
        testnetCalc: function() {
            const secDay = 86400
            let dailyMined = (secDay / this.blocktime) * 15
            let totalNodeCost = this.nodeCost * this.nodeTime * this.userNodes
            let totalBandwidthCost = this.bandWidthCost * this.nodeTime * this.userNodes
            let dailyNodeCost = this.nodeCost / 30 * this.userNodes
            let dailyBandwidthCost = this.bandWidthCost / 30 * this.userNodes
            this.testTokensDaily = (dailyMined * this.userNodes / this.totalNodes).toFixed(0)
            this.totalTestTokens = (this.testTokensDaily * 30 * this.nodeTime).toFixed(0)
            this.totalMainTokens = (this.totalTestTokens / 5).toFixed(0)
            this.usdProfitPerDay = (this.testTokensDaily / 5 * this.nknPrice - dailyBandwidthCost - dailyNodeCost).toFixed(2)
            this.usdProfit = (this.nknPrice * this.totalMainTokens - totalBandwidthCost - totalNodeCost).toFixed(2)
        },

        fetch: function() {
            let LatestTweets = {
                "customCallback": this.setTweets,
                "profile": {
                    "screenName": 'nkn_org'
                },
                "domId": 'latest-tweets',
                "maxTweets": 20,
                "enableLinks": true,
                "showUser": true,
                "showTime": true,
                "showImages": true,
                "lang": 'en',
                "showRetweet": false

            };
            twitterFetcher.fetch(LatestTweets);
        },
        setTweets(tweets) {
            this.tweets = tweets;
        },
        rotate: function() {
            if (this.showing == this.tweets.length - 1) {
                this.showing = -1;
            }
            this.showing += .5;
            setTimeout(function() {
                this.showing += .5;
            }.bind(this), 600);

        },
        checkBalance: function() {
            getBalance()

        }
    }

})

app.$mount("#app")