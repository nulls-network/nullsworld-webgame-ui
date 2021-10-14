<template>
    <div v-if="data" class="arena mt-3" :style="`background: ${background} rgba(0, 0, 0, 0.2);`">
        <div class="arena-info-box">
            <div class="arena-info-head">
                <div class="arena-info-icon">
                    <img :src="`/nulls${calcNullsImage(data?.challenger_pet_id)}.png`" />
                </div>
                <div>Arena #{{ data?.item_id }}</div>
            </div>
            <div class="arena-info-content">
                <div class="arena-info-line">
                    <div class="arena-info-left">
                        <img src="/ring-small.png" />
                        <span>Combat ID</span>
                    </div>
                    <div>{{ data?.id }}</div>
                </div>
                <div class="arena-info-line">
                    <div class="arena-info-left">
                        <img src="/star-small.png" />
                        <span>Multiplier</span>
                    </div>
                    <div>{{ data?.current_max_multipe }}x</div>
                </div>
                <div class="arena-info-line">
                    <div class="arena-info-left">
                        <img src="/diamond-small.png" />
                        <span>Prize pool</span>
                    </div>
                    <div>{{ formatNumber(removeDecimal(data?.current_jackpot, data?.token_precision)) }} {{ data?.token_name }}</div>
                </div>
                <div class="arena-info-line">
                    <div class="arena-info-left">
                        <img src="/dragon-small.png" />
                        <span>Challengers</span>
                    </div>
                    <div>{{ data?.current_count }}</div>
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
            <div class="arena-nulls">
                <div class="arena-nulls-item">
                    <img
                        :src="`/nulls${guardiansNulls}.png`"
                        :class="leftRotate.includes(guardiansNulls) ? 'mirror' : ''"
                    />
                    <div class="guardians">Guardians</div>
                </div>
                <div class="arena-nulls-item">
                    <img
                        :src="`/nulls${challengerNulls}.png`"
                        :class="rightRotate.includes(challengerNulls) ? 'mirror' : ''"
                    />
                    <div class="challenger">Challenger</div>
                </div>
            </div>
        </div>
    </div>
    <div v-else>loading</div>
</template>


<script>
import { Ring } from '@/backends'
import { removeDecimal, formatNumber, formatDate, addDecimal, guid, calcArenaImage, calcNullsImage } from '@/utils/common'

export default {
    data() {
        return {
            removeDecimal, formatNumber, formatDate, addDecimal, guid, calcArenaImage, calcNullsImage,
            data: null,
            leftRotate: [2, 4],
            rightRotate: [1, 3, 5]
        }
    },
    props: {
        combatId: {
            default: ''
        }
    },
    async created() {
        this.fetchData()
    },
    watch: {
        combatId() {
            this.fetchData()
        }
    },
    computed: {
        guardiansNulls() {
            return calcNullsImage(this.data?.ring_pet_id)
        },
        challengerNulls() {
            return calcNullsImage(this.data?.challenger_pet_id)
        },
        background() {
            return `url(gamebg${calcArenaImage(this.data?.item_id)}.jpg)`
        }
    },
    methods: {
        async fetchData() {
            if (!this.combatId) return
            const { data } = await Ring.getCombatResult({ id: this.combatId })
            if (data.code !== 200) return this.$message.error(data.message)
            this.data = data.data
            console.log(data)
        },
        tokenAmount(number) {
            return formatNumber(removeDecimal(number, this.tokenDecimals))
        }
    },
}

</script>

<style scoped>
.nulls-select div:nth-child(2) {
    width: 60px;
    background-color: purple;
}

.arena {
    position: relative;
    height: 620px;
    background-size: cover;
    box-shadow: 1px 1px 5px #0000004d;
    width: 1100px;
    background-blend-mode: multiply;
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

.arena-nulls img {
    width: 186px;
}

.arena-nulls-item {
    display: flex;
    flex-direction: column;
    user-select: none;
    display: flex;
    align-items: flex-end;
    padding: 40px 0;
}

.arena-right-top {
    position: absolute;
    top: 26px;
    right: 26px;
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

.mirror {
    transform: rotateY(180deg);
}

.arena-nulls-item div {
    margin: 15px 0;
    font-size: 18px;
    font-weight: bolder;
    font-style: italic;
    padding: 6px 25px;
    border-radius: 21px;
    background-color: #00000066;
    text-shadow: 0 0 3px #00000066;
    border: 3px solid #fef9e7;
    box-shadow: 0 0 10px #ffffff66 inset, 0 0 10px #00000033;
}

.guardians {
    color: rgb(255, 254, 205);
}

.challenger {
    color: #ffffff;
}
</style>