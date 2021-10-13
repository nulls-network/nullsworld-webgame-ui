<template>
    <div class="w-full">
        <div class="back-bar">
            <button @click="$router.back()" class="image-button"></button>
        </div>
        <div
            class="arena mt-3"
            :style="`background-image: url(pk${calcArenaImage(ringData?.item_id || 1)}-background.png);`"
        >
            <div v-if="combating" class="combating-mask">
                <div class="flex flex-col items-center">
                    <SyncOutlined style="font-size: 112px;" class="py-2" spin />
                    <div>{{ tipText }}</div>
                </div>
                <div v-show="combatTime" class="py-4">{{ formatDate(combatTime, { fmt: 'mm:ss' }) }}</div>
            </div>
            <div class="arena-info-box">
                <div class="arena-info-head">
                    <div class="arena-info-icon">
                        <img :src="`/nulls${calcNullsImage(paramStore.pet_id)}.png`" />
                    </div>
                    <div>#{{ ringData?.item_id }}</div>
                </div>
                <div class="arena-info-content">
                    <div class="arena-info-line">
                        <div class="arena-info-left">
                            <img src="/ring-small.png" />
                            <span>Tickets</span>
                        </div>
                        <div>{{ tokenAmount(ringData?.tickets) }} {{ tokenSymbol }}</div>
                    </div>
                    <div class="arena-info-line">
                        <div class="arena-info-left">
                            <img src="/star-small.png" />
                            <span>Multiplier</span>
                        </div>
                        <div>{{ ringData?.multipe }}x</div>
                    </div>
                    <div class="arena-info-line">
                        <div class="arena-info-left">
                            <img src="/diamond-small.png" />
                            <span>Prize pool</span>
                        </div>
                        <div>{{ tokenAmount(ringData?.jackpot) }} {{ tokenSymbol }}</div>
                    </div>
                    <div class="arena-info-line">
                        <div class="arena-info-left">
                            <img src="/dragon-small.png" />
                            <span>Challengers</span>
                        </div>
                        <div>{{ ringData?.count }}</div>
                    </div>
                </div>
            </div>
            <div class="arena-right-top">
                <div class="arena-top-button">
                    <img src="/tips.png" />
                    <div>Records</div>
                </div>
            </div>
            <div class="arena-nulls-box">
                <div class="nulls-select" v-show="false">
                    <div
                        @click="$root.openGlobalModal('selectNullsCombat')"
                        style="height: 234px;"
                        class="select-nulls"
                    >SELECT NULLS</div>
                    <!-- <div>
                        <img class="arrow-button active-button" src="/arrow-left.png" />
                    </div>
                    <div>asd</div>
                    <div>
                        <img class="arrow-button active-button" src="/arrow-right.png" />
                    </div>-->
                </div>

                <div class="arena-nulls">
                    <div class="arena-nulls-item">
                        <img :src="`/nulls${calcNullsImage(paramStore.pet_id)}.png`" />
                        <div>Guardians</div>
                    </div>
                    <div>
                        <img
                            @click="handleCombat"
                            :class="[combating ? 'disabled-button' : '', 'pk-button', 'active-button']"
                            src="/pk-button.png"
                        />
                    </div>
                    <div class="arena-nulls-item">
                        <img
                            v-if="paramStore.arenaNullsId"
                            :src="`/nulls${calcNullsImage(paramStore.arenaNullsId)}.png`"
                        />
                        <div
                            @click="$root.openGlobalModal('selectNullsCombat')"
                            style="height: 234px;"
                            class="select-nulls"
                            v-else
                        >SELECT NULLS</div>
                        <div v-if="paramStore.arenaNullsId">
                            <span
                                class="p-2 ml-2 select-nulls"
                                style="font-size: 12px;"
                                @click="$root.openGlobalModal('selectNullsCombat')"
                            >Nulls #{{ paramStore.arenaNullsId }} (Change)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { Ring } from '@/backends'
import { removeDecimal, formatNumber, formatDate, addDecimal, guid, calcArenaImage, calcNullsImage } from '@/utils/common'
import { NullsRankManager, ERC20 } from '@/contracts'
import { CheckCircleTwoTone, SyncOutlined, CloseCircleTwoTone } from '@ant-design/icons-vue'
import { h } from 'vue'
import { BigNumber } from 'ethers'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet/constants'


export default {
    data() {
        return {
            removeDecimal, formatNumber, formatDate, addDecimal, guid, calcArenaImage, calcNullsImage,
            ringData: {},
            tokenDecimals: 6,
            tokenSymbol: 'USDT',

            rankManagerContract: undefined,
            nullsWorldCoreContract: undefined,
            approving: false,
            combating: false,

            combatTimeInterval: undefined,
            combatTime: 0,

            r: undefined,
            tipText: '',
        }
    },
    async created() {
        if (this.$route.params.myPetId) this.paramStore.arenaNullsId = this.$route.params.myPetId
        /* if (!this.paramStore.arenaNullsId) this.$root.openGlobalModal('selectNullsCombat') */
        this.getRingData()

        // Create contracts
        this.rankManagerContract = this.wallet.createContract(NullsRankManager)

        this.tokenAddress = ERC20.getAddress(this.tokenSymbol)
        this.tokenContract = this.wallet.createERC20(this.tokenAddress)

        // Get decimals
        this.tokenContract['decimals']().then(d => {
            this.tokenDecimals = d
        })


        this.updateBalance().then(() => {
            this.updateBalanceInterval = setInterval(this.updateBalance, 10_000);
        })
    },
    watch: {
        combating(newVal, oldVal) {
            if (newVal !== oldVal) {
                this.combatTime = 0

            }
        }
    },
    methods: {
        async updateBalance() {
            this.tokenBalance = removeDecimal(await this.tokenContract['balanceOf'](this.wallet.address), this.tokenDecimals)
        },
        async getRingData() {
            const { data } = await Ring.getRingById({ id: this.$route.params.arenaId })
            if (data.code !== 200) return this.$message.error(data.message)
            this.ringData = data.data
        },
        tokenAmount(number) {
            return formatNumber(removeDecimal(number, this.tokenDecimals))
        },
        async handleCombat() {
            if (this.r) clearInterval(this.r)
            if (!this.paramStore.arenaNullsId) return this.$message.error('Please choose your nulls before the combat.')

            // Check allowance
            const ALLOWANCE = BigNumber.from(1_000_000_000_000)
            const allowance = await this.tokenContract['allowance'](this.wallet.address, NullsRankManager.address)

            // Approve if need
            if (allowance < ALLOWANCE) {
                this.approving = true
                let hiedeApprovingHint = this.$message.loading({ content: 'Approving required, waiting for your approval', key: 'approving', duration: 0 })
                const approveAmount = addDecimal(ALLOWANCE, this.usdtDecimals).toString()
                try {
                    const approveTx = await this.tokenContract['approve'](NullsRankManager.address, approveAmount)
                    hiedeApprovingHint = this.$message.loading({ content: WALLET_TIPS.txSend, key: 'approving', duration: 0 })
                    await approveTx.wait().then(receipt => {
                        console.log(receipt)
                        if (receipt.status === 1) {
                            console.log(`================approveTx=================`)
                            this.$message.success('Successful approve!')
                            hiedeApprovingHint()
                            this.approving = false
                        }
                    })
                } catch (err) {
                    hiedeApprovingHint()
                    console.error(err)
                    this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
                    this.approving = false
                }
            }

            // Send pk transcation
            this.tipText = 'Preparing to send a transaction...'
            this.combating = true
            let hiedeCombatingHint = this.$message.loading({ content: 'Combat requests are being submitted...', key: 'combating', duration: 0 })

            const latestBlock = await this.wallet.signer.provider.getBlock()
            if (!latestBlock) {
                hiedeCombatingHint()
                this.combating = false
                this.$message.error('Could not get latest block, please try again.')
                return
            }

            try {
                const deadline = latestBlock.timestamp + 1800
                const uuid = guid()
                this.tipText = 'Sending...'
                const pkTx = await this.rankManagerContract.pk(this.ringData.item_id, this.paramStore.arenaNullsId, deadline, uuid)
                clearInterval(this.combatTimeInterval)
                this.combatTimeInterval = setInterval(() => {
                    this.combatTime += 1000
                }, 1000);
                this.tipText = 'Waiting for the block to come out...'
                await pkTx.wait().then(receipt => {
                    console.log(receipt)
                    if (receipt.status === 1) {
                        this.tipText = 'Fighting!!'
                        console.log(`================pkTx=================`)
                        this.updateBalance()
                        this.$notification.open({
                            message: 'Combat has begun!',
                            description: `The combat has begun, please wait for the result... UUID: ${uuid}`,
                            icon: h(SyncOutlined, { twoToneColor: '#52c41a' }),
                        })
                        this.r = setInterval(async () => {
                            const { data } = await Ring.requestCombatResult({ uuid })
                            if (!data.data) return

                            if (data.data.isWin === 0) {
                                this.$notification.open({
                                    message: 'You win!',
                                    description: `You win! ${uuid}`,
                                    icon: h(CheckCircleTwoTone, { twoToneColor: '#52c41a' }),
                                })
                                clearInterval(this.r)
                                this.combating = false
                            } else {
                                this.$notification.open({
                                    message: 'You lose!',
                                    description: `You lose! ${uuid}`,
                                    icon: h(CloseCircleTwoTone, { twoToneColor: '#FF3B27' }),
                                })
                                clearInterval(this.r)
                                this.combating = false
                            }
                        }, 2000);
                    }
                })
            } catch (err) {
                hiedeCombatingHint()
                console.error(err)
                this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
                this.combating = false
            }
        }
    },
}

</script>

<style scoped>
.combating-mask {
    color: #ffffff;
    font-weight: bold;
    z-index: 15;
    height: 100%;
    width: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-shadow: 1px 1px 3px #000000;
    font-size: 32px;
    user-select: none;
    cursor: wait;
    background-color: #00000066;
}

.nulls-select {
    position: absolute;
    display: flex;
    justify-content: space-between;
    align-items: center;
    top: -200px;
    right: 140px;
    width: 600px;
    height: 200px;
}

.pk-button {
    height: 80px;
}

.active-button {
    cursor: pointer;
    transition: 0.2s ease;
}

.disabled-button {
    filter: grayscale(100%);
    pointer-events: none;
}

.active-button:hover {
    transform: scale(1.1);
    filter: brightness(1.1);
}

.active-button:active {
    transform: scale(0.95) translateY(4px);
    filter: brightness(0.95);
}

.nulls-select div:not(:nth-child(2)) {
}

.nulls-select div:nth-child(2) {
    width: 60px;
    background-color: purple;
}

.arena {
    position: relative;
    height: 720px;
    background-size: cover;
    box-shadow: 1px 1px 5px #0000004d;
}

.arena-nulls-box {
    display: flex;
    justify-content: center;
    position: absolute;
    height: 310px;
    padding: 30px;
    width: 100%;
    bottom: 0;
}

.arena-nulls {
    display: flex;
    justify-content: space-between;
    width: 70%;
}

.arena-nulls div {
    display: flex;
    justify-content: center;
    align-items: center;
}

.arena-nulls div:not(:nth-child(2)) img {
    height: 236px;
}

.arena-nulls div:not(:nth-child(2)) {
    /* width: 300px; */
    display: flex;
    flex-direction: column;
}

.arena-nulls div:not(:nth-child(2)) div {
    width: 100%;
}

.arena-nulls-item {
    user-select: none;
    display: flex;
    align-items: flex-end;
    padding: 40px 0;
    width: calc(100% - 600px);
}

.arena-nulls-item div {
    color: #ffffff;
    font-size: 16px;
    font-weight: bold;
    padding: 15px 0;
    text-shadow: 1px 1px 3px #000000;
}

.arena-right-top {
    position: absolute;
    top: 26px;
    right: 26px;
}

.arrow-button {
    height: 48px;
    width: 48px;
}

.arena-top-button {
    position: relative;
    user-select: none;
}

.arena-top-button img {
    width: 60px;
    height: 60px;
}

.arena-top-button div {
    position: absolute;
    width: 100%;
    text-align: center;
    bottom: -22px;
    font-size: 16px;
    font-weight: 500;
    color: #c4ffff;
    text-shadow: -1px 0 2px #002bd4, 0 1px 2px #002bd4, 1px 0 2px #002bd4,
        0 -1px 2px #002bd4;
}

.arena-info-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.arena-info-left {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #ffffff;
}

.arena-info-left img {
    height: 24px;
    width: 24px;
    margin: 0 10px 0 6px;
}

.arena-info-line div:last-child {
    color: #fff100;
    padding: 0 10px;
}

.arena-info-box {
    position: absolute;
    top: 43px;
    left: 43px;
    height: 230px;
    width: 273px;
    user-select: none;
}

.arena-info-head {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 52px;
    background-image: linear-gradient(#505dd8, #439bff);
    border: 2px solid #00fdf8;
    color: #ffffff;
    font-weight: bold;
    font-style: italic;
    font-size: 18px;
}

.arena-info-icon {
    position: absolute;
    top: calc(52px - 73px);
    left: -16px;
    height: 73px;
    width: 80px;
    background-image: url("/arena-info-icon.png");
    background-repeat: no-repeat;
    background-size: 80px 73px;
    overflow: hidden;
    border: 1px solid transparent;
}

.arena-info-icon img {
    position: absolute;
    left: 2px;
    width: calc(100% - 10px);
    height: 100%;
    top: 10px;
}

.arena-info-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 10px;
    height: calc(100% - 52px);
    background-image: linear-gradient(#505dd8b3, #439bffb3);
    border: 2px solid #00fdf8;
    border-top: 0;
}

.image-button {
    width: 45px;
    height: 45px;
    padding: 0 20px;
    background-repeat: round;
    background-size: 100%, auto;
    transition: 0.2s ease;
    background-image: url("/retreat.png");
}
.image-button:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
}

.image-button:active {
    transform: scale(0.95);
    filter: brightness(0.9);
}

.select-nulls {
    user-select: none;
    cursor: pointer;
    transition: 0.2s ease;
    background-color: #00000099;
    border-radius: 8px;
    border: 2px solid transparent;
}

.select-nulls:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
    border-color: #ffffff;
}

.select-nulls:active {
    transform: scale(0.95);
    filter: brightness(0.95);
}
</style>