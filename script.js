class WarpConfigGenerator {
    constructor() {
        this.sessionCache = {
            keys: null,
            accountData: null,
            installId: null,
            fcmToken: null
        };
        
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.setupModal();
        this.pingTestServers();
    }

    attachEventListeners() {
        document.querySelectorAll('.config-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const configType = e.currentTarget.dataset.config;
                this.generateConfig(configType);
            });
        });

        document.getElementById('copyThroneBtn').addEventListener('click', () => {
            this.copyThroneConfig();
        });
    }

    setupModal() {
        const modal = document.getElementById('throneModal');
        const closeBtn = modal.querySelector('.close');

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    pingTestServers() {
        const servers = [
            { id: 'default', host: '162.159.192.1', port: 500, name: 'По умолчанию' },
            { id: 'pl', host: 'pl.tribukvy.ltd', port: 500, name: ' Польша' },
            { id: 'de', host: 'de.tribukvy.ltd', port: 500, name: ' Германия' },
            { id: 'ru', host: 'ru0.tribukvy.ltd', port: 500, name: ' Россия' },
            { id: 'ee', host: 'ee.tribukvy.ltd', port: 500, name: ' Эстония' },
            { id: 'nl1', host: 'nl0.tribukvy.ltd', port: 500, name: ' Нидерланды 1' },
            { id: 'nl2', host: 'nl.tribukvy.ltd', port: 500, name: ' Нидерланды 2' },
            { id: 'fi1', host: 'fi0.tribukvy.ltd', port: 500, name: ' Финляндия 1' },
            { id: 'fi2', host: 'fi.tribukvy.ltd', port: 500, name: ' Финляндия 2' }
        ];
        let pingSection = document.getElementById('ping-section');
        if (!pingSection) {
            pingSection = document.createElement('section');
            pingSection.id = 'ping-section';
            pingSection.className = 'ping-section';
            pingSection.innerHTML = `
                <h2>Тест пинга к серверам</h2>
                <div class="ping-status">Измерение задержки...</div>
                <div class="ping-results"></div>
                <button class="ping-refresh-btn" onclick="location.reload()">Обновить тест</button>
            `;
            const serverSection = document.querySelector('.server-section');
            if (serverSection) {
                serverSection.parentNode.insertBefore(pingSection, serverSection.nextSibling);
            }
        }

        const resultsContainer = pingSection.querySelector('.ping-results');
        const statusEl = pingSection.querySelector('.ping-status');
        for (const server of servers) {
            const latency = this.testServerLatency(server);
            this.displayPingResult(server, latency, resultsContainer);
        }

        statusEl.textContent = 'Тест завершен';
        this.highlightBestServer(resultsContainer);
    }

    async testServerLatency(server) {
        const startTime = performance.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            await fetch(`http://${server.host}:${server.port}`, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal,
                cache: 'no-store'
            }).catch(() => {
            });

            clearTimeout(timeoutId);
            const latency = Math.round(performance.now() - startTime);
            return latency;
        } catch (error) {
            return 999;
        }
    }

    displayPingResult(server, latency, container) {
        let resultEl = container.querySelector(`[data-server-id="${server.id}"]`);
        if (!resultEl) {
            resultEl = document.createElement('div');
            resultEl.className = 'ping-result-item';
            resultEl.setAttribute('data-server-id', server.id);
            container.appendChild(resultEl);
        }

        const latencyClass = latency < 50 ? 'excellent' : latency < 100 ? 'good' : latency < 200 ? 'fair' : 'poor';
        const latencyText = latency >= 999 ? 'Timeout' : `${latency}ms`;

        resultEl.innerHTML = `
            <span class="ping-server-name">${server.name}</span>
            <span class="ping-latency ${latencyClass}">${latencyText}</span>
        `;
    }

    highlightBestServer(container) {
        const results = Array.from(container.querySelectorAll('.ping-result-item'));
        let bestLatency = Infinity;
        let bestServer = null;

        results.forEach(result => {
            const latencyText = result.querySelector('.ping-latency').textContent;
            if (latencyText !== 'Timeout') {
                const latency = parseInt(latencyText);
                if (latency < bestLatency) {
                    bestLatency = latency;
                    bestServer = result;
                }
            }
        });

        if (bestServer) {
            bestServer.classList.add('best-server');
            const badge = document.createElement('span');
            badge.className = 'best-badge';
            badge.textContent = 'Лучший';
            bestServer.appendChild(badge);
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    showStatus(message, isError = false) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status-message ${isError ? 'error' : 'success'}`;
        
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status-message';
        }, 3000);
    }

    getSelectedDNS() {
        const selectedDNS = document.querySelector('input[name="dns"]:checked');
        if (selectedDNS.value === '1.1.1.1') {
            return "1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001";
        } else {
            return "8.8.8.8, 8.8.4.4, 2001:4860:4860::8888, 2001:4860:4860::8844";
        }
    }

    getSelectedServer() {
        const selectedServer = document.querySelector('input[name="server"]:checked');
        return selectedServer ? selectedServer.value : 'default';
    }

    generateRandomEndpoint() {
        const ports = [500, 854, 859, 864, 878, 880, 890, 891, 894, 903, 908, 928, 934, 939, 942, 943, 945, 946, 955, 968, 987, 988, 1002, 1010, 1014, 1018, 1070, 1074, 1180, 1387, 1701, 1843, 2371, 2408, 2506, 3138, 3476, 3581, 3854, 4177, 4198, 4233, 4500, 5279, 5956, 7103, 7152, 7156, 7281, 7559, 8319, 8742, 8854, 8886];
        const port = ports[Math.floor(Math.random() * ports.length)];
        const selectedServer = this.getSelectedServer();

        if (selectedServer === 'default') {
            const prefixes = ["162.159.192.", "162.159.195.", "engage.cloudflareclient.com"];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            
            if (prefix === "engage.cloudflareclient.com") {
                return `${prefix}:${port}`;
            } else {
                const randomNumber = Math.floor(Math.random() * 10) + 1;
                return `${prefix}${randomNumber}:${port}`;
            }
        }

        const serverMap = {
            'pl': 'pl.tribukvy.ltd',
            'de': 'de.tribukvy.ltd',
            'ru': 'ru0.tribukvy.ltd',
            'ee': 'ee.tribukvy.ltd',
            'nl1': 'nl0.tribukvy.ltd',
            'nl2': 'nl.tribukvy.ltd',
            'fi1': 'fi0.tribukvy.ltd',
            'fi2': 'fi.tribukvy.ltd'
        };

        const endpoint = serverMap[selectedServer] || 'de.tribukvy.ltd';
        return `${endpoint}:${port}`;
    }

    generateRandomString(length) {
        if (this.sessionCache.installId && this.sessionCache.installId.length === length) {
            return this.sessionCache.installId;
        }
        
        const randomString = Array.from({ length }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
                Math.floor(Math.random() * 62)
            )
        ).join('');
        
        if (length === 22) {
            this.sessionCache.installId = randomString;
        }
        
        return randomString;
    }

    async fetchWithTimeout(url, options = {}, timeout = 3000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout for ${url}`);
            }
            throw error;
        }
    }

    async fetchKeys() {
        if (this.sessionCache.keys) {
            return this.sessionCache.keys;
        }
        
        const endpoints = [
            'https://keygen.warp-generator.workers.dev',
            'https://warp-generation.vercel.app/keys'
        ];
        
        let lastError;
        
        for (let i = 0; i < endpoints.length; i++) {
            try {
                const response = await this.fetchWithTimeout(endpoints[i]);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch keys from ${i}: ${response.status}`);
                }
                
                const data = await response.text();
                const keys = {
                    publicKey: this.extractKey(data, 'PublicKey'),
                    privateKey: this.extractKey(data, 'PrivateKey'),
                };
                
                this.sessionCache.keys = keys;
                return keys;
            } catch (error) {
                lastError = error;
                
                if (i === endpoints.length - 1) {
                    throw lastError;
                }
            }
        }
        
        throw lastError;
    }

    async fetchAccount(publicKey, installId, fcmToken) {
        if (this.sessionCache.accountData && this.sessionCache.keys && this.sessionCache.keys.publicKey === publicKey) {
            return this.sessionCache.accountData;
        }
        
        const endpoints = [
            'https://www.warp-generator.workers.dev/wg',
            'https://warp.sub-aggregator.workers.dev/wg',
            'https://warp-generation.vercel.app/wg'
        ];
        
        let lastError;
        
        for (let i = 0; i < endpoints.length; i++) {
            try {
                const response = await this.fetchWithTimeout(endpoints[i], {
                    method: 'POST',
                    headers: {
                        'User-Agent': 'okhttp/3.12.1',
                        'CF-Client-Version': 'a-6.10-2158',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key: publicKey,
                        install_id: installId,
                        fcm_token: fcmToken,
                        tos: new Date().toISOString(),
                        model: 'PC',
                        serial_number: installId,
                        locale: 'de_DE',
                    }),
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch account from ${i}: ${response.status}`);
                }
                
                const accountData = await response.json();
                
                this.sessionCache.accountData = accountData;
                this.sessionCache.fcmToken = fcmToken;
                
                return accountData;
            } catch (error) {
                lastError = error;
                
                if (i === endpoints.length - 1) {
                    throw lastError;
                }
            }
        }
        
        throw lastError;
    }

    generateLocalKeys() {
        const privateKeyBytes = new Uint8Array(32);
        crypto.getRandomValues(privateKeyBytes);
        const privateKey = btoa(String.fromCharCode(...privateKeyBytes));
        const publicKeyBytes = new Uint8Array(32);
        crypto.getRandomValues(publicKeyBytes);
        const publicKey = btoa(String.fromCharCode(...publicKeyBytes));
        
        return { publicKey, privateKey };
    }

    generateMockAccountData(publicKey) {
        const clientId = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
        
        return {
            config: {
                client_id: clientId,
                interface: {
                    addresses: {
                        v4: `172.16.0.${Math.floor(Math.random() * 254) + 1}/32`,
                        v6: `2606:4700:110:8f81:8b6c:${Math.floor(Math.random() * 9999)}:${Math.floor(Math.random() * 9999)}:${Math.floor(Math.random() * 9999)}/128`
                    }
                },
                peers: [{
                    public_key: 'bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=',
                    allowed_ips: ['0.0.0.0/0', '::/0']
                }]
            }
        };
    }

    extractKey(data, keyName) {
        const match = data.match(new RegExp(`${keyName}:\\s(.+)`));
        return match ? match[1].trim() : null;
    }

    generateReserved(clientId) {
        return Array.from(atob(clientId))
            .map((char) => char.charCodeAt(0))
            .slice(0, 3)
            .join(', ');
    }

    getRandomJcParams() {
        const options = [
            "Jc = 4\nJmin = 40\nJmax = 70",
            "Jc = 120\nJmin = 23\nJmax = 911"
        ];
        return options[Math.floor(Math.random() * options.length)];
    }

    downloadConfig(fileName, content) {
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'application/octet-stream' });
        element.href = URL.createObjectURL(file);
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    async generateConfig(configType) {
        this.showLoading();
        
        try {
            let publicKey, privateKey;
            try {
                const keys = await this.fetchKeys();
                publicKey = keys.publicKey;
                privateKey = keys.privateKey;
            } catch (apiError) {
                const keys = this.generateLocalKeys();
                publicKey = keys.publicKey;
                privateKey = keys.privateKey;
            }
            
            const installId = this.generateRandomString(22);
            const fcmToken = `${installId}:APA91b${this.generateRandomString(134)}`;
            let accountData;
            try {
                accountData = await this.fetchAccount(publicKey, installId, fcmToken);
            } catch (accountError) {
                accountData = this.generateMockAccountData(publicKey);
            }
            
            const selectedDNS = this.getSelectedDNS();
            const randomEndpoint = this.generateRandomEndpoint();
            const randomNumber = Math.floor(Math.random() * (99 - 10 + 1)) + 10;

            let configContent;
            let fileName;

            switch (configType) {
                case 'awg':
                    fileName = `WARPr_${randomNumber}.conf`;
                    configContent = this.generateAWGConfig(privateKey, accountData, selectedDNS, randomEndpoint);
                    break;
                case 'awgm1':
                    fileName = `WARPm1_${randomNumber}.conf`;
                    configContent = this.generateAWGM1Config(privateKey, accountData, selectedDNS, randomEndpoint);
                    break;
                case 'awgm2':
                    fileName = `WARPm2_${randomNumber}.conf`;
                    configContent = this.generateAWGM2Config(privateKey, accountData, selectedDNS, randomEndpoint);
                    break;
                case 'awgm3':
                    fileName = `WARPm3_${randomNumber}.conf`;
                    configContent = this.generateAWGM3Config(privateKey, accountData, selectedDNS, randomEndpoint);
                    break;
                case 'clash':
                    fileName = `ClashWARP_${randomNumber}.yaml`;
                    configContent = this.generateClashConfig(privateKey, accountData);
                    break;
                case 'throne':
                    this.showThroneConfig(privateKey, accountData);
                    this.hideLoading();
                    return;
                case 'neko':
                    fileName = `NekoWARP_${randomNumber}.conf`;
                    configContent = this.generateNekoConfig(privateKey, accountData);
                    break;
                case 'husi':
                    fileName = `HusiWARP_${randomNumber}.conf`;
                    configContent = this.generateHusiConfig(privateKey, accountData);
                    break;
                case 'karing':
                    fileName = `KaringWARP_${randomNumber}.conf`;
                    configContent = this.generateKaringConfig(privateKey, accountData);
                    break;
                case 'wiresock':
                    fileName = `WARPw_${randomNumber}.conf`;
                    configContent = this.generateWireSockConfig(privateKey, accountData, selectedDNS, randomEndpoint);
                    break;
                default:
                    throw new Error('Unknown config type');
            }

            this.downloadConfig(fileName, configContent);
            this.showStatus(`Конфигурация ${fileName} успешно скачана!`);
            
        } catch (error) {
            console.error('Error generating config:', error);
            this.showStatus(`Ошибка: ${error.message || 'Не удалось сгенерировать конфигурацию'}. Попробуйте еще раз.`, true);
        } finally {
            this.hideLoading();
        }
    }

    generateAWGConfig(privateKey, accountData, selectedDNS, randomEndpoint) {
        return `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${randomEndpoint}`;
    }

    generateAWGM1Config(privateKey, accountData, selectedDNS, randomEndpoint) {
        return `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4
I1 = <b 0xce000000010897a297ecc34cd6dd000044d0ec2e2e1ea2991f467ace4222129b5a098823784694b4897b9986ae0b7280135fa85e196d9ad980b150122129ce2a9379531b0fd3e871ca5fdb883c369832f730e272d7b8b74f393f9f0fa43f11e510ecb2219a52984410c204cf875585340c62238e14ad04dff382f2c200e0ee22fe743b9c6b8b043121c5710ec289f471c91ee414fca8b8be8419ae8ce7ffc53837f6ade262891895f3f4cecd31bc93ac5599e18e4f01b472362b8056c3172b513051f8322d1062997ef4a383b01706598d08d48c221d30e74c7ce000cdad36b706b1bf9b0607c32ec4b3203a4ee21ab64df336212b9758280803fcab14933b0e7ee1e04a7becce3e2633f4852585c567894a5f9efe9706a151b615856647e8b7dba69ab357b3982f554549bef9256111b2d67afde0b496f16962d4957ff654232aa9e845b61463908309cfd9de0a6abf5f425f577d7e5f6440652aa8da5f73588e82e9470f3b21b27b28c649506ae1a7f5f15b876f56abc4615f49911549b9bb39dd804fde182bd2dcec0c33bad9b138ca07d4a4a1650a2c2686acea05727e2a78962a840ae428f55627516e73c83dd8893b02358e81b524b4d99fda6df52b3a8d7a5291326e7ac9d773c5b43b8444554ef5aea104a738ed650aa979674bbed38da58ac29d87c29d387d80b526065baeb073ce65f075ccb56e47533aef357dceaa8293a523c5f6f790be90e4731123d3c6152a70576e90b4ab5bc5ead01576c68ab633ff7d36dcde2a0b2c68897e1acfc4d6483aaaeb635dd63c96b2b6a7a2bfe042f6aed82e5363aa850aace12ee3b1a93f30d8ab9537df483152a5527faca21efc9981b304f11fc95336f5b9637b174c5a0659e2b22e159a9fed4b8e93047371175b1d6d9cc8ab745f3b2281537d1c75fb9451871864efa5d184c38c185fd203de206751b92620f7c369e031d2041e152040920ac2c5ab5340bfc9d0561176abf10a147287ea90758575ac6a9f5ac9f390d0d5b23ee12af583383d994e22c0cf42383834bcd3ada1b3825a0664d8f3fb678261d57601ddf94a8a68a7c273a18c08aa99c7ad8c6c42eab67718843597ec9930457359dfdfbce024afc2dcf9348579a57d8d3490b2fa99f278f1c37d87dad9b221acd575192ffae1784f8e60ec7cee4068b6b988f0433d96d6a1b1865f4e155e9fe020279f434f3bf1bd117b717b92f6cd1cc9bea7d45978bcc3f24bda631a36910110a6ec06da35f8966c9279d130347594f13e9e07514fa370754d1424c0a1545c5070ef9fb2acd14233e8a50bfc5978b5bdf8bc1714731f798d21e2004117c61f2989dd44f0cf027b27d4019e81ed4b5c31db347c4a3a4d85048d7093cf16753d7b0d15e078f5c7a5205dc2f87e330a1f716738dce1c6180e9d02869b5546f1c4d2748f8c90d9693cba4e0079297d22fd61402dea32ff0eb69ebd65a5d0b687d87e3a8b2c42b648aa723c7c7daf37abcc4bb85caea2ee8f55bec20e913b3324ab8f5c3304f820d42ad1b9f2ffc1a3af9927136b4419e1e579ab4c2ae3c776d293d397d575df181e6cae0a4ada5d67ecea171cca3288d57c7bbdaee3befe745fb7d634f70386d873b90c4d6c6596bb65af68f9e5121e67ebf0d89d3c909ceedfb32ce9575a7758ff080724e1ab5d5f43074ecb53a479af21ed03d7b6899c36631c0166f9d47e5e1d4528a5d3d3f744029c4b1c190cbfbad06f5f83f7ad0429fa9a2719c56ffe3783460e166de2d8>

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${randomEndpoint}`;
    }

    generateAWGM2Config(privateKey, accountData, selectedDNS, randomEndpoint) {
        return `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4
I1 = <b 0xc7000000010809a1ed4edbbe7615000044d017a61a0d774f04290f119e701ef0035df2b0ed571b0b575e6a07246b856eb6ec036fef07f1e07b861251ad737abeb67e64be714c1dcd865312b1b6c35c089c997aeb5c18f808696fe97289513945d84ca846467603e94e44224877f2c1d3261e4ac18740be4bd064369c94fc08978d99b54bf615250998639010c1284248e1d73004b81fcb20b559d8a17eced7eab3964b5b88ca7a3b8579fc8c1c934189e77143b4ac434138114b1048651b56545b87acbef0952763538f3ddeb37cfc6d58b4881c3b719d7ff78f6ee1324a2914a32381c05a64c700466d280be007253bb030d179c4f1b3dc221e1974e2ee6d6e2b9e8d709159b5ef22e1783dbba845c20ca1c83b066c73835920ad70b806df0aee0351e3fc9ab1e42e8b2a30fe235ff0612eee19744949cecee0463b76514ad90c1f7ceaa557c18586ab561d49482e73c85d0143785da14a441bf82f78783b61cccd44aecb1947516e79b5ca5a6b3a8aed6040fae0eeabdc55a88dc19ade832d99fca90c7a629cacc07192d7e47e3c6a271b95b0ea3392562a06a1cab79f40ea92916ebee197b7b5f14b251824e1ed20ff2ca80b1f03a43e45157589bc61b978e97851025b3b7ccc17d291e1cb60fe48a5c26829dce11dd23c2e73265a9ebf8617c985e4fee4681e863f990061f4dea465a7d2524bd0edcf4b48d4b8f25fc359b15babd2637284a4774077dca60091f1a781cfee1bef9713dd5943a579d7470bc5970542fbb27fdf77880a8d8751b1f642c7a3f019a05ab94bf63d3525ef34e9290b5c8d477f2714e6d6e3e4d35c1983f5e16fda57fcdf071b513f8f088dbe8d5a97577d17a5383a496c3f313adfdd47c962bbaebd6aa13b46439eb742622c29ca067db0ec1853064c3cbbffe0a215a19fce47d49703ed58ebbd89721172d256d1cf30188106fb2f863186511401fad54d087aa2fb3d1b85768db386bd7102e8060ac157bac011acdcdae2799b9aee1467c3424013455bd028fcaacdc3c77d28ea199967d617ea7d0d0815f3cc407934a76d1293dccba210d1709a13e5dd67c9ba47cd113f5bdd740358eff13164159fd09bc2f7ec6cfa64d9df7e2e2f88706b0ff3a92ccf6f078456cfe0bdd89292cfe2680badc1eac9f7d36efe8eb6912c7b164508d13e6c0911c15f73c233cbe4fc70ff2ade1e1be4bbb738e0939159e2078a9438f05b756a003371f4861481c38f1cdd2d7b06deb62869e9fe79a8abaa920646fa2e8fa28f0d80c136376c7b56046bae4c05c0cdf64efb8c47bbfc5a1a4c0b045061ef0d71618e0d206a1d7f245fd5c03191b152673ba8dff8e1b8de7c50234a93cba91e3888adb228cc02beded4b1c0946797d3ef02dec2edb6ad0ac21f89f4be364c317da7c22440e9f358d512203f4b7ab20388af68b8915d0152db2c8a0687bfaea870f7529bb92a22b35bd79bc6d490591406346ecd78342ee3563c4883a8251679691c2d4e963397e24653520795511b018915374c954bddb940a9d7a16d1c8bd798fc7dbfb0599a7074e13f87e14efa8d511bb2579ec029b1bda18fe971b30fbe19e986ff2686a69bf3f1bb929de93ae70345ebca998b11e0a2b41890cba628d8f6e7c4e94790735e5299b4ff07cd3080f7d53c9cbe1911d2cd5925b3213e033c272506a87886cf761a283a779564d3241e3c28f632e166b5d756e1786ce077614c4444e3f2aed5decb3613b925ea3e558c21d4faf8ba54edd0f3a5d4>

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${randomEndpoint}`;
    }

    generateAWGM3Config(privateKey, accountData, selectedDNS, randomEndpoint) {
        return `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4
I1 = <b 0x494e56495445207369703a626f624062696c6f78692e636f6d205349502f322e300d0a5669613a205349502f322e302f55445020706333332e61746c616e74612e636f6d3b6272616e63683d7a39684734624b3737366173646864730d0a4d61782d466f7277617264733a2037300d0a546f3a20426f62203c7369703a626f624062696c6f78692e636f6d3e0d0a46726f6d3a20416c696365203c7369703a616c6963654061746c616e74612e636f6d3e3b7461673d313932383330313737340d0a43616c6c2d49443a20613834623463373665363637313040706333332e61746c616e74612e636f6d0d0a435365713a2033313431353920494e564954450d0a436f6e746163743a203c7369703a616c69636540706333332e61746c616e74612e636f6d3e0d0a436f6e74656e742d547970653a206170706c69636174696f6e2f7364700d0a436f6e74656e742d4c656e6774683a20300d0a0d0a>
I2 = <b 0x5349502f322e302031303020547279696e670d0a5669613a205349502f322e302f55445020706333332e61746c616e74612e636f6d3b6272616e63683d7a39684734624b3737366173646864730d0a546f3a20426f62203c7369703a626f624062696c6f78692e636f6d3e0d0a46726f6d3a20416c696365203c7369703a616c69636540706333332e61746c616e74612e636f6d3e3b7461673d313932383330313737340d0a43616c6c2d49443a20613834623463373665363637313040706333332e61746c616e74612e636f6d0d0a435365713a2033313431353920494e564954450d0a436f6e74656e742d4c656e6774683a20300d0a0d0a>

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${randomEndpoint}`;
    }

    generateClashConfig(privateKey, accountData) {
        const reserved = this.generateReserved(accountData.config.client_id);
        
        return `warp-common: &warp-common
  type: wireguard
  ip: ${accountData.config.interface.addresses.v4}
  ipv6: ${accountData.config.interface.addresses.v6}
  private-key: ${privateKey}
  public-key: ${accountData.config.peers[0].public_key}
  allowed-ips: ['0.0.0.0/0']
  reserved: [${reserved}]
  udp: true
  mtu: 1280
  remote-dns-resolve: true
  dns: [1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001]
  server: 162.159.192.1
  port: 4500
   
proxies:
- name: "AWG 1.5 (1 Вариант)"
  <<: *warp-common
  amnezia-wg-option:
   jc: 120
   jmin: 23
   jmax: 911
   s1: 0
   s2: 0
   h1: 1
   h2: 2
   h4: 3
   h3: 4  
   i1: <b 0xce000000010897a297ecc34cd6dd000044d0ec2e2e1ea2991f467ace4222129b5a098823784694b4897b9986ae0b7280135fa85e196d9ad980b150122129ce2a9379531b0fd3e871ca5fdb883c369832f730e272d7b8b74f393f9f0fa43f11e510ecb2219a52984410c204cf875585340c62238e14ad04dff382f2c200e0ee22fe743b9c6b8b043121c5710ec289f471c91ee414fca8b8be8419ae8ce7ffc53837f6ade262891895f3f4cecd31bc93ac5599e18e4f01b472362b8056c3172b513051f8322d1062997ef4a383b01706598d08d48c221d30e74c7ce000cdad36b706b1bf9b0607c32ec4b3203a4ee21ab64df336212b9758280803fcab14933b0e7ee1e04a7becce3e2633f4852585c567894a5f9efe9706a151b615856647e8b7dba69ab357b3982f554549bef9256111b2d67afde0b496f16962d4957ff654232aa9e845b61463908309cfd9de0a6abf5f425f577d7e5f6440652aa8da5f73588e82e9470f3b21b27b28c649506ae1a7f5f15b876f56abc4615f49911549b9bb39dd804fde182bd2dcec0c33bad9b138ca07d4a4a1650a2c2686acea05727e2a78962a840ae428f55627516e73c83dd8893b02358e81b524b4d99fda6df52b3a8d7a5291326e7ac9d773c5b43b8444554ef5aea104a738ed650aa979674bbed38da58ac29d87c29d387d80b526065baeb073ce65f075ccb56e47533aef357dceaa8293a523c5f6f790be90e4731123d3c6152a70576e90b4ab5bc5ead01576c68ab633ff7d36dcde2a0b2c68897e1acfc4d6483aaaeb635dd63c96b2b6a7a2bfe042f6aed82e5363aa850aace12ee3b1a93f30d8ab9537df483152a5527faca21efc9981b304f11fc95336f5b9637b174c5a0659e2b22e159a9fed4b8e93047371175b1d6d9cc8ab745f3b2281537d1c75fb9451871864efa5d184c38c185fd203de206751b92620f7c369e031d2041e152040920ac2c5ab5340bfc9d0561176abf10a147287ea90758575ac6a9f5ac9f390d0d5b23ee12af583383d994e22c0cf42383834bcd3ada1b3825a0664d8f3fb678261d57601ddf94a8a68a7c273a18c08aa99c7ad8c6c42eab67718843597ec9930457359dfdfbce024afc2dcf9348579a57d8d3490b2fa99f278f1c37d87dad9b221acd575192ffae1784f8e60ec7cee4068b6b988f0433d96d6a1b1865f4e155e9fe020279f434f3bf1bd117b717b92f6cd1cc9bea7d45978bcc3f24bda631a36910110a6ec06da35f8966c9279d130347594f13e9e07514fa370754d1424c0a1545c5070ef9fb2acd14233e8a50bfc5978b5bdf8bc1714731f798d21e2004117c61f2989dd44f0cf027b27d4019e81ed4b5c31db347c4a3a4d85048d7093cf16753d7b0d15e078f5c7a5205dc2f87e330a1f716738dce1c6180e9d02869b5546f1c4d2748f8c90d9693cba4e0079297d22fd61402dea32ff0eb69ebd65a5d0b687d87e3a8b2c42b648aa723c7c7daf37abcc4bb85caea2ee8f55bec20e913b3324ab8f5c3304f820d42ad1b9f2ffc1a3af9927136b4419e1e579ab4c2ae3c776d293d397d575df181e6cae0a4ada5d67ecea171cca3288d57c7bbdaee3befe745fb7d634f70386d873b90c4d6c6596bb65af68f9e5121e67ebf0d89d3c909ceedfb32ce9575a7758ff080724e1ab5d5f43074ecb53a479af21ed03d7b6899c36631c0166f9d47e5e1d4528a5d3d3f744029c4b1c190cbfbad06f5f83f7ad0429fa9a2719c56ffe3783460e166de2d8>
- name: "AWG 1.5 (2 Вариант)"
  <<: *warp-common
  amnezia-wg-option:
   jc: 120
   jmin: 23
   jmax: 911
   s1: 0
   s2: 0
   h1: 1
   h2: 2
   h4: 3
   h3: 4
   i1: <b 0xc7000000010809a1ed4edbbe7615000044d017a61a0d774f04290f119e701ef0035df2b0ed571b0b575e6a07246b856eb6ec036fef07f1e07b861251ad737abeb67e64be714c1dcd865312b1b6c35c089c997aeb5c18f808696fe97289513945d84ca846467603e94e44224877f2c1d3261e4ac18740be4bd064369c94fc08978d99b54bf615250998639010c1284248e1d73004b81fcb20b559d8a17eced7eab3964b5b88ca7a3b8579fc8c1c934189e77143b4ac434138114b1048651b56545b87acbef0952763538f3ddeb37cfc6d58b4881c3b719d7ff78f6ee1324a2914a32381c05a64c700466d280be007253bb030d179c4f1b3dc221e1974e2ee6d6e2b9e8d709159b5ef22e1783dbba845c20ca1c83b066c73835920ad70b806df0aee0351e3fc9ab1e42e8b2a30fe235ff0612eee19744949cecee0463b76514ad90c1f7ceaa557c18586ab561d49482e73c85d0143785da14a441bf82f78783b61cccd44aecb1947516e79b5ca5a6b3a8aed6040fae0eeabdc55a88dc19ade832d99fca90c7a629cacc07192d7e47e3c6a271b95b0ea3392562a06a1cab79f40ea92916ebee197b7b5f14b251824e1ed20ff2ca80b1f03a43e45157589bc61b978e97851025b3b7ccc17d291e1cb60fe48a5c26829dce11dd23c2e73265a9ebf8617c985e4fee4681e863f990061f4dea465a7d2524bd0edcf4b48d4b8f25fc359b15babd2637284a4774077dca60091f1a781cfee1bef9713dd5943a579d7470bc5970542fbb27fdf77880a8d8751b1f642c7a3f019a05ab94bf63d3525ef34e9290b5c8d477f2714e6d6e3e4d35c1983f5e16fda57fcdf071b513f8f088dbe8d5a97577d17a5383a496c3f313adfdd47c962bbaebd6aa13b46439eb742622c29ca067db0ec1853064c3cbbffe0a215a19fce47d49703ed58ebbd89721172d256d1cf30188106fb2f863186511401fad54d087aa2fb3d1b85768db386bd7102e8060ac157bac011acdcdae2799b9aee1467c3424013455bd028fcaacdc3c77d28ea199967d617ea7d0d0815f3cc407934a76d1293dccba210d1709a13e5dd67c9ba47cd113f5bdd740358eff13164159fd09bc2f7ec6cfa64d9df7e2e2f88706b0ff3a92ccf6f078456cfe0bdd89292cfe2680badc1eac9f7d36efe8eb6912c7b164508d13e6c0911c15f73c233cbe4fc70ff2ade1e1be4bbb738e0939159e2078a9438f05b756a003371f4861481c38f1cdd2d7b06deb62869e9fe79a8abaa920646fa2e8fa28f0d80c136376c7b56046bae4c05c0cdf64efb8c47bbfc5a1a4c0b045061ef0d71618e0d206a1d7f245fd5c03191b152673ba8dff8e1b8de7c50234a93cba91e3888adb228cc02beded4b1c0946797d3ef02dec2edb6ad0ac21f89f4be364c317da7c22440e9f358d512203f4b7ab20388af68b8915d0152db2c8a0687bfaea870f7529bb92a22b35bd79bc6d490591406346ecd78342ee3563c4883a8251679691c2d4e963397e24653520795511b018915374c954bddb940a9d7a16d1c8bd798fc7dbfb0599a7074e13f87e14efa8d511bb2579ec029b1bda18fe971b30fbe19e986ff2686a69bf3f1bb929de93ae70345ebca998b11e0a2b41890cba628d8f6e7c4e94790735e5299b4ff07cd3080f7d53c9cbe1911d2cd5925b3213e033c272506a87886cf761a283a779564d3241e3c28f632e166b5d756e1786ce077614c4444e3f2aed5decb3613b925ea3e558c21d4faf8ba54edd0f3a5d4>
- name: "AWG 1.5 (3 Вариант)"
  <<: *warp-common
  amnezia-wg-option:
   jc: 120
   jmin: 23
   jmax: 911
   s1: 0
   s2: 0
   h1: 1
   h2: 2
   h4: 3
   h3: 4   
   i1: <b 0x494e56495445207369703a626f624062696c6f78692e636f6d205349502f322e300d0a5669613a205349502f322e302f55445020706333332e61746c616e74612e636f6d3b6272616e63683d7a39684734624b3737366173646864730d0a4d61782d466f7277617264733a2037300d0a546f3a20426f62203c7369703a626f624062696c6f78692e636f6d3e0d0a46726f6d3a20416c696365203c7369703a616c69636540706333332e61746c616e74612e636f6d3e3b7461673d313932383330313737340d0a43616c6c2d49443a20613834623463373665363637313040706333332e61746c616e74612e636f6d0d0a435365713a2033313431353920494e564954450d0a436f6e746163743a203c7369703a616c69636540706333332e61746c616e74612e636f6d3e0d0a436f6e74656e742d547970653a206170706c69636174696f6e2f7364700d0a436f6e74656e742d4c656e6774683a20300d0a0d0a>
   i2: <b 0x5349502f322e302031303020547279696e670d0a5669613a205349502f322e302f55445020706333332e61746c616e74612e636f6d3b6272616e63683d7a39684734624b3737366173646864730d0a546f3a20426f62203c7369703a626f624062696c6f78692e636f6d3e0d0a46726f6d3a20416c696365203c7369703a616c69636540706333332e61746c616e74612e636f6d3e3b7461673d313932383330313737340d0a43616c6c2d49443a20613834623463373665363637313040706333332e61746c616e74612e636f6d0d0a435365713a2033313431353920494e564954450d0a436f6e74656e742d4c656e6774683a20300d0a0d0a>
   j1: <b 0xabcdef1234567890>
   itime: 120
  
proxy-groups:
- name: WARP
  type: select
  icon: https://www.vectorlogo.zone/logos/cloudflare/cloudflare-icon.svg
  proxies:
    - "AWG 1.5 (1 Вариант)"
    - "AWG 1.5 (2 Вариант)"
    - "AWG 1.5 (3 Вариант)"
  url: 'http://speed.cloudflare.com/'
  interval: 300`;
    }

    showThroneConfig(privateKey, accountData) {
        const reserved = this.generateReserved(accountData.config.client_id).replace(/, /g, '-');
        const privateKeyWithoutEqual = privateKey.replace(/=$/, '');
        const config = `wg://162.159.192.1:500?private_key=${privateKeyWithoutEqual}%3D&peer_public_key=bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo%3D&pre_shared_key=&reserved=${reserved}&persistent_keepalive=0&mtu=1280&use_system_interface=false&local_address=${accountData.config.interface.addresses.v4}/32-${accountData.config.interface.addresses.v6}/128&workers=0&enable_amnezia=true&junk_packet_count=4&junk_packet_min_size=40&junk_packet_max_size=70&init_packet_junk_size=0&response_packet_junk_size=0&init_packet_magic_header=1&response_packet_magic_header=2&underload_packet_magic_header=3&transport_packet_magic_header=4#WARP`;

        document.getElementById('throneText').value = config;
        document.getElementById('throneModal').classList.add('show');
    }

    copyThroneConfig() {
        const throneText = document.getElementById('throneText');
        throneText.select();
        document.execCommand('copy');
        this.showStatus('Конфигурация скопирована!');
    }

    generateNekoConfig(privateKey, accountData) {
        const reserved = this.generateReserved(accountData.config.client_id);
        return `{
"mtu": 1280,
"reserved": [${reserved}],
"private_key": "${privateKey}",
"type": "wireguard",
"local_address": ["${accountData.config.interface.addresses.v4}/32", "${accountData.config.interface.addresses.v6}/128"],
"peer_public_key": "${accountData.config.peers[0].public_key}",
"server": "162.159.192.1",
"server_port": 500
}`;
    }

    generateHusiConfig(privateKey, accountData) {
        const reserved = this.generateReserved(accountData.config.client_id);
        return `{
"type": "wireguard",
"tag": "proxy",
"mtu": 1280,
"address": ["${accountData.config.interface.addresses.v4}/32", "${accountData.config.interface.addresses.v6}/128"],
"private_key": "${privateKey}",
"listen_port": 0,
"peers": [
{
"address": "162.159.192.1",
"port": 500,
"public_key": "${accountData.config.peers[0].public_key}",
"pre_shared_key": "",
"allowed_ips": [
"0.0.0.0/0",
"::/0"
],
"persistent_keepalive_interval": 600,
"reserved": "${reserved}"
}
],
"detour": "direct"
}`;
    }

    generateKaringConfig(privateKey, accountData) {
        const reserved = this.generateReserved(accountData.config.client_id);
        return `{
  "outbounds":   [
{
"tag": "WARP",
"reserved": [${reserved}],
"mtu": 1280,
"fake_packets": "5-10",
"fake_packets_size": "40-100",
"fake_packets_delay": "20-250",
"fake_packets_mode": "m4",
"private_key": "${privateKey}",
"type": "wireguard",
"local_address": ["${accountData.config.interface.addresses.v4}/32", "${accountData.config.interface.addresses.v6}/128"],
"peer_public_key": "${accountData.config.peers[0].public_key}",
"server": "162.159.192.1",
"server_port": 500
}
  ]
}`;
    }

    generateWireSockConfig(privateKey, accountData, selectedDNS, randomEndpoint) {
        const domains = ['ozon.ru', 'apteka.ru', 'mail.ru', 'psbank.ru', 'lenta.ru', 'www.pochta.ru', 'rzd.ru', 'rutube.ru', 'gosuslugi.ru'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        
        return `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4

# Protocol masking
Id = ${randomDomain}
Ip = quic
Ib = firefox

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${randomEndpoint}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WarpConfigGenerator();
});
