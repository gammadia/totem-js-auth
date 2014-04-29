/*jslint browser: true */
/*global define */

define(['bignum', 'cryptojs.sha1', 'cryptojs.sha512'], function (Bn, CryptoJS) {
    'use strict';

    /**
     *  @property Object groups Groupes prédéfinits pour g et N selong RFC 5054 Annexe A
     */
    var groups = {
            1024: {
                g: Bn.create('2', 10),
                N: Bn.create('eeaf0ab9' + 'adb38dd6' + '9c33f80a' + 'fa8fc5e8' + '60726187' + '75ff3c0b' + '9ea2314c' +
                            '9c256576' + 'd674df74' + '96ea81d3' + '383b4813' + 'd692c6e0' + 'e0d5d8e2' + '50b98be4' +
                            '8e495c1d' + '6089dad1' + '5dc7d7b4' + '6154d6b6' + 'ce8ef4ad' + '69b15d49' + '82559b29' +
                            '7bcf1885' + 'c529f566' + '660e57ec' + '68edbc3c' + '05726cc0' + '2fd4cbf4' + '976eaa9a' +
                            'fd5138fe' + '8376435b' + '9fc61d2f' + 'c0eb06e3', 16),
                k: Bn.create('7556aa045aef2cdd07abaf0f665c3e818913186f', 16)
            },
            1536: {
                g: Bn.create('2', 10),
                N: Bn.create('9def3caf' + 'b939277a' + 'b1f12a86' + '17a47bbb' + 'dba51df4' + '99ac4c80' + 'beeea961' +
                            '4b19cc4d' + '5f4f5f55' + '6e27cbde' + '51c6a94b' + 'e4607a29' + '1558903b' + 'a0d0f843' +
                            '80b655bb' + '9a22e8dc' + 'df028a7c' + 'ec67f0d0' + '8134b1c8' + 'b9798914' + '9b609e0b' +
                            'e3bab63d' + '47548381' + 'dbc5b1fc' + '764e3f4b' + '53dd9da1' + '158bfd3e' + '2b9c8cf5' +
                            '6edf0195' + '39349627' + 'db2fd53d' + '24b7c486' + '65772e43' + '7d6c7f8c' + 'e442734a' +
                            'f7ccb7ae' + '837c264a' + 'e3a9beb8' + '7f8a2fe9' + 'b8b5292e' + '5a021fff' + '5e91479e' +
                            '8ce7a28c' + '2442c6f3' + '15180f93' + '499a234d' + 'cf76e3fe' + 'd135f9bb', 16),
                k: Bn.create('815a4561e1a68b3fb7f6c03bbb3daaa35d528d90', 16)
            },
            2048: {
                g: Bn.create('2', 10),
                N: Bn.create('ac6bdb41' + '324a9a9b' + 'f166de5e' + '1389582f' + 'af72b665' + '1987ee07' + 'fc319294' +
                            '3db56050' + 'a37329cb' + 'b4a099ed' + '8193e075' + '7767a13d' + 'd52312ab' + '4b03310d' +
                            'cd7f48a9' + 'da04fd50' + 'e8083969' + 'edb767b0' + 'cf609517' + '9a163ab3' + '661a05fb' +
                            'd5faaae8' + '2918a996' + '2f0b93b8' + '55f97993' + 'ec975eea' + 'a80d740a' + 'dbf4ff74' +
                            '7359d041' + 'd5c33ea7' + '1d281e44' + '6b14773b' + 'ca97b43a' + '23fb8016' + '76bd207a' +
                            '436c6481' + 'f1d2b907' + '8717461a' + '5b9d32e6' + '88f87748' + '544523b5' + '24b0d57d' +
                            '5ea77a27' + '75d2ecfa' + '032cfbdb' + 'f52fb378' + '61602790' + '04e57ae6' + 'af874e73' +
                            '03ce5329' + '9ccc041c' + '7bc308d8' + '2a5698f3' + 'a8d0c382' + '71ae35f8' + 'e9dbfbb6' +
                            '94b5c803' + 'd89f7ae4' + '35de236d' + '525f5475' + '9b65e372' + 'fcd68ef2' + '0fa7111f' +
                            '9E4AFF73', 16),
                k: Bn.create('a56303f32c60e599e82c396f0d57f1b344a7313c', 16)
            },
            3072: {
                g: Bn.create('5', 10),
                N: Bn.create('ffffffff' + 'ffffffff' + 'c90fdaa2' + '2168c234' + 'c4c6628b' + '80dc1cd1' + '29024e08' +
                            '8a67cc74' + '020bbea6' + '3b139b22' + '514a0879' + '8e3404dd' + 'ef9519b3' + 'cd3a431b' +
                            '302b0a6d' + 'f25f1437' + '4fe1356d' + '6d51c245' + 'e485b576' + '625e7ec6' + 'f44c42e9' +
                            'a637ed6b' + '0bff5cb6' + 'f406b7ed' + 'ee386bfb' + '5a899fa5' + 'ae9f2411' + '7c4b1fe6' +
                            '49286651' + 'ece45b3d' + 'c2007cb8' + 'a163bf05' + '98da4836' + '1c55d39a' + '69163fa8' +
                            'fd24cf5f' + '83655d23' + 'dca3ad96' + '1c62f356' + '208552bb' + '9ed52907' + '7096966d' +
                            '670c354e' + '4abc9804' + 'f1746c08' + 'ca18217c' + '32905e46' + '2e36ce3b' + 'e39e772c' +
                            '180e8603' + '9b2783a2' + 'ec07a28f' + 'b5c55df0' + '6f4c52c9' + 'de2bcbf6' + '95581718' +
                            '3995497c' + 'ea956ae5' + '15d22618' + '98fa0510' + '15728e5a' + '8aaac42d' + 'ad33170d' +
                            '04507a33' + 'a85521ab' + 'df1cba64' + 'ecfb8504' + '58dbef0a' + '8aea7157' + '5d060c7d' +
                            'b3970f85' + 'a6e1e4c7' + 'abf5ae8c' + 'db0933d7' + '1e8c94e0' + '4a25619d' + 'cee3d226' +
                            '1ad2ee6b' + 'f12ffa06' + 'd98a0864' + 'd8760273' + '3ec86a64' + '521f2b18' + '177b200c' +
                            'bbe11757' + '7a615d6c' + '770988c0' + 'bad946e2' + '08e24fa0' + '74e5ab31' + '43db5bfc' +
                            'e0fd108e' + '4b82d120' + 'a93ad2ca' + 'ffffffff' + 'ffffffff', 16),
                k: Bn.create('c2fd8f8b274fa634efd702bd22fb6c1218d9f2a0', 16)
            },
            4096: {
                g: Bn.create('5', 10),
                N: Bn.create('ffffffff' + 'ffffffff' + 'c90fdaa2' + '2168c234' + 'c4c6628b' + '80dc1cd1' + '29024e08' +
                            '8a67cc74' + '020bbea6' + '3b139b22' + '514a0879' + '8e3404dd' + 'ef9519b3' + 'cd3a431b' +
                            '302b0a6d' + 'f25f1437' + '4fe1356d' + '6d51c245' + 'e485b576' + '625e7ec6' + 'f44c42e9' +
                            'a637ed6b' + '0bff5cb6' + 'f406b7ed' + 'ee386bfb' + '5a899fa5' + 'ae9f2411' + '7c4b1fe6' +
                            '49286651' + 'ece45b3d' + 'c2007cb8' + 'a163bf05' + '98da4836' + '1c55d39a' + '69163fa8' +
                            'fd24cf5f' + '83655d23' + 'dca3ad96' + '1c62f356' + '208552bb' + '9ed52907' + '7096966d' +
                            '670c354e' + '4abc9804' + 'f1746c08' + 'ca18217c' + '32905e46' + '2e36ce3b' + 'e39e772c' +
                            '180e8603' + '9b2783a2' + 'ec07a28f' + 'b5c55df0' + '6f4c52c9' + 'de2bcbf6' + '95581718' +
                            '3995497c' + 'ea956ae5' + '15d22618' + '98fa0510' + '15728e5a' + '8aaac42d' + 'ad33170d' +
                            '04507a33' + 'a85521ab' + 'df1cba64' + 'ecfb8504' + '58dbef0a' + '8aea7157' + '5d060c7d' +
                            'b3970f85' + 'a6e1e4c7' + 'abf5ae8c' + 'db0933d7' + '1e8c94e0' + '4a25619d' + 'cee3d226' +
                            '1ad2ee6b' + 'f12ffa06' + 'd98a0864' + 'd8760273' + '3ec86a64' + '521f2b18' + '177b200c' +
                            'bbe11757' + '7a615d6c' + '770988c0' + 'bad946e2' + '08e24fa0' + '74e5ab31' + '43db5bfc' +
                            'e0fd108e' + '4b82d120' + 'a9210801' + '1a723c12' + 'a787e6d7' + '88719a10' + 'bdba5b26' +
                            '99c32718' + '6af4e23c' + '1a946834' + 'b6150bda' + '2583e9ca' + '2ad44ce8' + 'dbbbc2db' +
                            '04de8ef9' + '2e8efc14' + '1fbecaa6' + '287c5947' + '4e6bc05d' + '99b2964f' + 'a090c3a2' +
                            '233ba186' + '515be7ed' + '1f612970' + 'cee2d7af' + 'b81bdd76' + '2170481c' + 'd0069127' +
                            'd5b05aa9' + '93b4ea98' + '8d8fddc1' + '86ffb7dc' + '90a6c08f' + '4df435c9' + '34063199' +
                            'FFFFFFFF' + 'FFFFFFFF', 16),
                k: Bn.create('a521694605810c01abdfa01fd6207173a56178e9', 16)
            },
            6144: {
                g: Bn.create('5', 10),
                N: Bn.create('ffffffff' + 'ffffffff' + 'c90fdaa2' + '2168c234' + 'c4c6628b' + '80dc1cd1' + '29024e08' +
                            '8a67cc74' + '020bbea6' + '3b139b22' + '514a0879' + '8e3404dd' + 'ef9519b3' + 'cd3a431b' +
                            '302b0a6d' + 'f25f1437' + '4fe1356d' + '6d51c245' + 'e485b576' + '625e7ec6' + 'f44c42e9' +
                            'a637ed6b' + '0bff5cb6' + 'f406b7ed' + 'ee386bfb' + '5a899fa5' + 'ae9f2411' + '7c4b1fe6' +
                            '49286651' + 'ece45b3d' + 'c2007cb8' + 'a163bf05' + '98da4836' + '1c55d39a' + '69163fa8' +
                            'fd24cf5f' + '83655d23' + 'dca3ad96' + '1c62f356' + '208552bb' + '9ed52907' + '7096966d' +
                            '670c354e' + '4abc9804' + 'f1746c08' + 'ca18217c' + '32905e46' + '2e36ce3b' + 'e39e772c' +
                            '180e8603' + '9b2783a2' + 'ec07a28f' + 'b5c55df0' + '6f4c52c9' + 'de2bcbf6' + '95581718' +
                            '3995497c' + 'ea956ae5' + '15d22618' + '98fa0510' + '15728e5a' + '8aaac42d' + 'ad33170d' +
                            '04507a33' + 'a85521ab' + 'df1cba64' + 'ecfb8504' + '58dbef0a' + '8aea7157' + '5d060c7d' +
                            'b3970f85' + 'a6e1e4c7' + 'abf5ae8c' + 'db0933d7' + '1e8c94e0' + '4a25619d' + 'cee3d226' +
                            '1ad2ee6b' + 'f12ffa06' + 'd98a0864' + 'd8760273' + '3ec86a64' + '521f2b18' + '177b200c' +
                            'bbe11757' + '7a615d6c' + '770988c0' + 'bad946e2' + '08e24fa0' + '74e5ab31' + '43db5bfc' +
                            'e0fd108e' + '4b82d120' + 'a9210801' + '1a723c12' + 'a787e6d7' + '88719a10' + 'bdba5b26' +
                            '99c32718' + '6af4e23c' + '1a946834' + 'b6150bda' + '2583e9ca' + '2ad44ce8' + 'dbbbc2db' +
                            '04de8ef9' + '2e8efc14' + '1fbecaa6' + '287c5947' + '4e6bc05d' + '99b2964f' + 'a090c3a2' +
                            '233ba186' + '515be7ed' + '1f612970' + 'cee2d7af' + 'b81bdd76' + '2170481c' + 'd0069127' +
                            'd5b05aa9' + '93b4ea98' + '8d8fddc1' + '86ffb7dc' + '90a6c08f' + '4df435c9' + '34028492' +
                            '36c3fab4' + 'd27c7026' + 'c1d4dcb2' + '602646de' + 'c9751e76' + '3dba37bd' + 'f8ff9406' +
                            'ad9e530e' + 'e5db382f' + '413001ae' + 'b06a53ed' + '9027d831' + '179727b0' + '865a8918' +
                            'da3edbeb' + 'cf9b14ed' + '44ce6cba' + 'ced4bb1b' + 'db7f1447' + 'e6cc254b' + '33205151' +
                            '2bd7af42' + '6fb8f401' + '378cd2bf' + '5983ca01' + 'c64b92ec' + 'f032ea15' + 'd1721d03' +
                            'f482d7ce' + '6e74fef6' + 'd55e702f' + '46980c82' + 'b5a84031' + '900b1c9e' + '59e7c97f' +
                            'bec7e8f3' + '23a97a7e' + '36cc88be' + '0f1d45b7' + 'ff585ac5' + '4bd407b2' + '2b4154aa' +
                            'cc8f6d7e' + 'bf48e1d8' + '14cc5ed2' + '0f8037e0' + 'a79715ee' + 'f29be328' + '06a1d58b' +
                            'b7c5da76' + 'f550aa3d' + '8a1fbff0' + 'eb19ccb1' + 'a313d55c' + 'da56c9ec' + '2ef29632' +
                            '387fe8d7' + '6e3c0468' + '043e8f66' + '3f4860ee' + '12bf2d5b' + '0b7474d6' + 'e694f91e' +
                            '6dcc4024' + 'ffffffff' + 'ffffffff', 16),
                k: Bn.create('153c65e6058ebcab714d6940818015c2283adcb2', 16)
            },
            8192: {
                g: Bn.create('19', 10),
                N: Bn.create('ffffffff' + 'ffffffff' + 'c90fdaa2' + '2168c234' + 'c4c6628b' + '80dc1cd1' + '29024e08' +
                            '8a67cc74' + '020bbea6' + '3b139b22' + '514a0879' + '8e3404dd' + 'ef9519b3' + 'cd3a431b' +
                            '302b0a6d' + 'f25f1437' + '4fe1356d' + '6d51c245' + 'e485b576' + '625e7ec6' + 'f44c42e9' +
                            'a637ed6b' + '0bff5cb6' + 'f406b7ed' + 'ee386bfb' + '5a899fa5' + 'ae9f2411' + '7c4b1fe6' +
                            '49286651' + 'ece45b3d' + 'c2007cb8' + 'a163bf05' + '98da4836' + '1c55d39a' + '69163fa8' +
                            'fd24cf5f' + '83655d23' + 'dca3ad96' + '1c62f356' + '208552bb' + '9ed52907' + '7096966d' +
                            '670c354e' + '4abc9804' + 'f1746c08' + 'ca18217c' + '32905e46' + '2e36ce3b' + 'e39e772c' +
                            '180e8603' + '9b2783a2' + 'ec07a28f' + 'b5c55df0' + '6f4c52c9' + 'de2bcbf6' + '95581718' +
                            '3995497c' + 'ea956ae5' + '15d22618' + '98fa0510' + '15728e5a' + '8aaac42d' + 'ad33170d' +
                            '04507a33' + 'a85521ab' + 'df1cba64' + 'ecfb8504' + '58dbef0a' + '8aea7157' + '5d060c7d' +
                            'b3970f85' + 'a6e1e4c7' + 'abf5ae8c' + 'db0933d7' + '1e8c94e0' + '4a25619d' + 'cee3d226' +
                            '1ad2ee6b' + 'f12ffa06' + 'd98a0864' + 'd8760273' + '3ec86a64' + '521f2b18' + '177b200c' +
                            'bbe11757' + '7a615d6c' + '770988c0' + 'bad946e2' + '08e24fa0' + '74e5ab31' + '43db5bfc' +
                            'e0fd108e' + '4b82d120' + 'a9210801' + '1a723c12' + 'a787e6d7' + '88719a10' + 'bdba5b26' +
                            '99c32718' + '6af4e23c' + '1a946834' + 'b6150bda' + '2583e9ca' + '2ad44ce8' + 'dbbbc2db' +
                            '04de8ef9' + '2e8efc14' + '1fbecaa6' + '287c5947' + '4e6bc05d' + '99b2964f' + 'a090c3a2' +
                            '233ba186' + '515be7ed' + '1f612970' + 'cee2d7af' + 'b81bdd76' + '2170481c' + 'd0069127' +
                            'd5b05aa9' + '93b4ea98' + '8d8fddc1' + '86ffb7dc' + '90a6c08f' + '4df435c9' + '34028492' +
                            '36c3fab4' + 'd27c7026' + 'c1d4dcb2' + '602646de' + 'c9751e76' + '3dba37bd' + 'f8ff9406' +
                            'ad9e530e' + 'e5db382f' + '413001ae' + 'b06a53ed' + '9027d831' + '179727b0' + '865a8918' +
                            'da3edbeb' + 'cf9b14ed' + '44ce6cba' + 'ced4bb1b' + 'db7f1447' + 'e6cc254b' + '33205151' +
                            '2bd7af42' + '6fb8f401' + '378cd2bf' + '5983ca01' + 'c64b92ec' + 'f032ea15' + 'd1721d03' +
                            'f482d7ce' + '6e74fef6' + 'd55e702f' + '46980c82' + 'b5a84031' + '900b1c9e' + '59e7c97f' +
                            'bec7e8f3' + '23a97a7e' + '36cc88be' + '0f1d45b7' + 'ff585ac5' + '4bd407b2' + '2b4154aa' +
                            'cc8f6d7e' + 'bf48e1d8' + '14cc5ed2' + '0f8037e0' + 'a79715ee' + 'f29be328' + '06a1d58b' +
                            'b7c5da76' + 'f550aa3d' + '8a1fbff0' + 'eb19ccb1' + 'a313d55c' + 'da56c9ec' + '2ef29632' +
                            '387fe8d7' + '6e3c0468' + '043e8f66' + '3f4860ee' + '12bf2d5b' + '0b7474d6' + 'e694f91e' +
                            '6dbe1159' + '74a3926f' + '12fee5e4' + '38777cb6' + 'a932df8c' + 'd8bec4d0' + '73b931ba' +
                            '3bc832b6' + '8d9dd300' + '741fa7bf' + '8afc47ed' + '2576f693' + '6ba42466' + '3aab639c' +
                            '5ae4f568' + '3423b474' + '2bf1c978' + '238f16cb' + 'e39d652d' + 'e3fdb8be' + 'fc848ad9' +
                            '22222e04' + 'a4037c07' + '13eb57a8' + '1a23f0c7' + '3473fc64' + '6cea306b' + '4bcbc886' +
                            '2f8385dd' + 'fa9d4b7f' + 'a2c087e8' + '79683303' + 'ed5bdd3a' + '062b3cf5' + 'b3a278a6' +
                            '6d2a13f8' + '3f44f82d' + 'df310ee0' + '74ab6a36' + '4597e899' + 'a0255dc1' + '64f31cc5' +
                            '0846851d' + 'f9ab4819' + '5ded7ea1' + 'b1d510bd' + '7ee74d73' + 'faf36bc3' + '1ecfa268' +
                            '359046f4' + 'eb879f92' + '4009438b' + '481c6cd7' + '889a002e' + 'd5ee382b' + 'c9190da6' +
                            'fc026e47' + '9558e447' + '5677e9aa' + '9e3050e2' + '765694df' + 'c81f56e8' + '80b96e71' +
                            '60c980dd' + '98edd3df' + 'ffffffff' + 'ffffffff', 16),
                k: Bn.create('3bc248edfafef15a15518351b43dfca0a37c4941', 16)
            }
        },

        /**
         *  @property {number} base_size Taille de base des clef en bit.
         */
        base_size = 384,

        /**
         *  @property {number} default_strenght Taille par défaut des clefs (groupes).
         */
        default_strenght = 1024,

        /**
         *  @property {Srp} Objet Srp.
         */
        Srp = {};

    /**
     *  Créer un objet d'authentification SRP.
     *
     *  @param {string} username Nom de l'utilisateur. (I)
     *  @param {string} password Mot de passe de l'utilisateur. (P)
     *  @param {integer} strenght Taille des clef générales à utiliser, en bit. ([1024], 1536, 2048, 3072, 4096, 6144, 8192)
     *  @returns {Srp}
     */
    Srp.create = function (username, password, strenght) {
        var that = null;

        strenght = strenght || default_strenght;

        that = Object.create(Srp.prototype, {
            username: {
                value: username,
                enumerable: false
            },
            password: {
                value: password,
                enumerable: false
            },
            strenght: {
                value: strenght,
                enumerable: false
            },
            g: {
                value: groups[strenght].g,
                enumerable: false
            },
            N: {
                value: groups[strenght].N,
                enumerable: false
            },
            k: {
                value: groups[strenght].k,
                enumerable: false
            }
        });

        return that;
    };

    Srp.prototype = {
        /**
         *  Clef privée du client (a). En gènère une si n'existe pas.
         *
         *  @returns {Bn} Représentation de la clef en Bignum.
         */
        geta: function () {
            if (this.a === undefined) {
                //  Vécteur de test OpenSSL RFC 5054 Annexe B
                //this.a = Bn.create('60975527035CF2AD1989806F0407210BC81EDC04E2762A56AFD529DDDA2D4393', 16);
                this.a = Bn.rand(base_size);
            }

            return this.a;
        },

        /**
         *  Clef publique du client (A). La calcul si n'existe pas.
         *  A = g^a
         *
         *  @returns {Bn} Clef publique en Bignum.
         */
        getA: function () {
            if (this.A === undefined) {
                this.A = this.g.modExp(this.geta(), this.N);
            }

            return this.A;
        },

        /**
         *  Définition de B
         *
         *  @param {string} B Représentation hexadecimale.
         */
        setB: function (B) {
            if (typeof B === 'string') {
                this.B = Bn.create(B, 16);
            } else {
                this.B = Bn.create(B);
            }
        },

        /**
         *  B, clef publique du serveur.
         *
         *  @returns {bignum} B
         */
        getB: function () {
            return this.B || Bn.create();
        },

        /**
         *  Définition de s
         *
         *  @param   {string} s Représentation hexadecimale.
         */
        sets: function (s) {
            if (typeof s === 'string') {
                this.s = Bn.create(s, 16);
            } else {
                this.s = Bn.create(s);
            }
        },

        /**
         *  Calcul de u.
         *  u = H(A , B)
         *  u = SHA1(A | B)
         *
         *  @returns {bignum} Valeur de u.
         */
        getu: function () {
            var hash = null;

            if (this.u === undefined) {
                hash = CryptoJS.algo.SHA1.create()
                        .update(CryptoJS.enc.Hex.parse(this.getA().toString(16)))
                        .update(CryptoJS.enc.Hex.parse(this.getB().toString(16)))
                        .finalize();
                this.u = Bn.create(hash.toString(CryptoJS.enc.Hex), 16);
            }

            return this.u;
        },

        /**
         *  Calcul de S.
         *  S = (B - kg ** x) ** a + ux
         *
         *  @returns {bignum} S
         */
        getS: function () {
            if (this.S === undefined) {
                //  B - kg ** x
                this.S = this.getB().modSub(
                    this.k.modMul(
                        this.g.modExp(this.getx(), this.N),
                        this.N
                    ),
                    this.N
                );

                //  ** a + ux
                this.S = this.S.modExp(
                    this.geta().modAdd(
                        this.getu().modMul(this.getx(), this.N),
                        this.N
                    ),
                    this.N
                );
            }

            return this.S;
        },

        /**
         *  Calcul de x.
         *  x = H(s, I, P)
         *  x = SHA1(s | SHA1(I | : | P))
         *
         *  @returns {bignum} x
         */
        getx: function () {
            if (this.x === undefined) {
                this.x = CryptoJS.SHA1(this.username + ':' + this.password);
                this.x = CryptoJS.algo.SHA1.create()
                            .update(CryptoJS.enc.Hex.parse(this.s.toString(16)))
                            .update(this.x)
                            .finalize();
                this.x = Bn.create(this.x.toString(CryptoJS.enc.Hex), 16);
            }

            return this.x;
        },

        /**
         *  Création du message de vérification M1.
         *  M1 = H(A, B, S)
         *  M1 = SHA1(A | B | S)
         *
         *  @return {Bignum} Valeure de vérification M1.
         */
        getM1: function () {
            var hash = CryptoJS.algo.SHA1.create()
                        .update(CryptoJS.enc.Hex.parse(this.getA().toString(16)))
                        .update(CryptoJS.enc.Hex.parse(this.getB().toString(16)))
                        .update(CryptoJS.enc.Hex.parse(this.getS().toString(16)))
                        .finalize();

            return Bn.create(hash.toString(CryptoJS.enc.Hex), 16);
        },

        /**
         *  Création du message de vérification M2.
         *  M2 = H(A, M1, S)
         *  M2 = SHA1(A | M1 | S)
         *
         *  @param  {string} M1 Premier message de vérification reçu du client.
         *
         *  @return {bignum}    Valeure de vérification M2.
         */
        getM2: function (M1) {
            var hash = CryptoJS.algo.SHA1.create()
                        .update(CryptoJS.enc.Hex.parse(this.getA().toString(16)))
                        .update(CryptoJS.enc.Hex.parse(M1 || this.getM1().toString(16)))
                        .update(CryptoJS.enc.Hex.parse(this.getS().toString(16)))
                        .finalize();

            return Bn.create(hash.toString(CryptoJS.enc.Hex), 16);
        },

        /**
         *  Calcul de la clef de session finale.
         *
         *  @return {bignum} Clef K de session.
         */
        getK: function () {
            if (this.K === undefined) {
                this.K = CryptoJS.SHA512(CryptoJS.enc.Hex.parse(this.getS().toString(16)));
                this.K = Bn.create(this.K.toString(CryptoJS.enc.Hex), 16);
            }

            return this.K;
        }
    };

    return Srp;
});
