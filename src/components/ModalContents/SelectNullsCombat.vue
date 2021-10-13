<template>
  <div class="arena-container">
    <div class="arena-title">
      Coming to Arena
      <span :class="[calcColor(arena?.item_id), 'arena-id']">#{{ arena?.item_id }}</span>
    </div>
    <div class="arena-introduce">Select a nulls for the challenge</div>
    <NeedWalletConnect
      @onWalletConnect="init"
      @onAddressChange="init"
      @onWalletDisconnect="onDisconnect"
    >
      <a-spin tip="Loading..." :spinning="fetching || approving || combating">
        <div class="my-nulls-content py-12">
          <NoNulls v-if="!wallet.connected || noNulls" />
          <div
            v-else
            v-for="n in displayNulls"
            :class="[n.pet_id === myPetId ? 'nulls-selected' : '', 'nulls']"
            @click="selectNulls(n)"
          >
            <div>
              <img style="height: 120px;" :src="`/nulls${calcNullsImage(n.pet_id)}.png`" />
            </div>
            <div class="pt-6 font-bold">
              <span style="font-size: 16px;">Nulls</span>
              <span :class="[calcColor(n.pet_id), 'nulls-id']">#{{ n.pet_id }}</span>
            </div>
          </div>
        </div>
      </a-spin>
      <div class="button-box flex justify-center mt-12">
        <color-button
          style="min-width: 260px;"
          @click="handleCombat"
          :disabled="combating || !myPetId || noNulls || !wallet.connected"
        >
          {{
            noNulls ? 'No Challenger Nulls' :
              !wallet.connected ? 'Wallet Not Connected' :
                !myPetId ? 'Please choose a Challenger' :
                  `Fight with Nulls #${myPetId}`
          }}
        </color-button>
        <color-button
          class="ml-4"
          buttonStyle="blue"
          @click="getRandNulls"
          :disabled="combating || noNulls || !wallet.connected"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </color-button>
      </div>
    </NeedWalletConnect>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { MyNulls } from '@/backends'
import { calcNullsImage, calcColor, addDecimal, randChoiceNum, guid } from '@/utils/common'
import { WALLET_ERRORS } from '@/utils/wallet/constants'
import Nulls from '@/components/Items/NullsItem.vue'
import NoNulls from '@/components/Items/NoNulls.vue'
import { SyncOutlined } from '@ant-design/icons-vue'
import { NullsRankManager } from '@/contracts'



export default {
  components: {
    Nulls, NoNulls, SyncOutlined
  },
  props: {
    arena: {
      default: undefined
    }
  },
  data() {
    return {
      addDecimal,
      calcNullsImage,
      calcColor,
      nulls: [],
      myPetId: undefined,
      approving: false,
      combating: false,
      fetching: true,
      updateDataInterval: -1,
      displayNulls: [],
      combatTranscation: '',
      requestKey: '',
      combatKey: ''
    }
  },
  async created() {
    await this.init()
  },
  unmounted() {
    clearInterval(this.updateDataInterval)
  },
  computed: {
    noNulls() {
      return this.nulls?.length < 1
    }
  },
  methods: {
    onDisconnect() {
      clearInterval(this.updateDataInterval)
    },
    async init() {
      if (!this.wallet.connected) return
      clearInterval(this.updateDataInterval)

      this.tokenContract = markRaw(this.wallet.createERC20(this.arena?.token))
      this.rankManagerContract = markRaw(this.wallet.createContract(NullsRankManager))

      this.wallet.watchContractEvent(this.rankManagerContract, 'RankNewNonce', event => {
        if (event?.transactionHash === this.combatTranscation) {
          this.combatTranscation = ''
          this.requestKey = event.args.requestKey
        }
      })

      this.wallet.watchContractEvent(this.rankManagerContract, 'RankUpdate', event => {
        if (event?.args.requestKey === this.requestKey) {
          this.requestKey = ''
          this.$emit('combatEnd', { petId: this.myPetId })
          if (event.args.isWin) {
            this.$notification.open({
              message: `Arena #${this.arena.item_id}: You got the victory! 🏳️‍🌈🏳️‍🌈🏳️‍🌈`,
              description: `Congratulations on your victory! 💪`,
              duration: 7,
              key: this.combatKey,
            })
            this.$emit('onWin', { petId: this.myPetId })
            this.combating = false
          } else {
            this.$notification.open({
              message: `Arena #${this.arena.item_id}: You lost the battle. 🏳️🏳️🏳️`,
              description: `Please don't be discouraged and keep up the good work! 💪`,
              duration: 7,
              key: this.combatKey,
            })
            this.$emit('onLose', { petId: this.myPetId })
            this.combating = false
          }
        }
      })


      this.updateMyNulls()
      this.updateDataInterval = setInterval(() => {
        this.updateMyNulls(true)
      }, 10000)
    },
    selectNulls(n) {
      this.myPetId = n.pet_id
    },
    randColor() {
      const items = ['blue', 'purple', 'red', 'orange']
      return items[Math.floor(Math.random() * items.length)]
    },
    updateMyNulls(isAutoUpdate = false) {
      if (!isAutoUpdate) this.fetching = true

      MyNulls.findNullsPK({ address: this.wallet.address }).then(({ data }) => {
        this.fetching = false
        if (data.code === 200) {
          this.nulls = data.data
          this.getRandNulls()
          if (!isAutoUpdate && this.paramStore.autoSelectNulls) this.handleCombat()
        }
      })
    },
    /* handleStartCombat() {
      this.myPetId = this.myPetId
      this.$root.closeGlobalModal()
      this.$router.push({ name: 'ArenaCombat', params: { arena.item_id: this.paramStore.arena.item_id, myPetId: this.myPetId } })
    }, */
    getRandNulls() {
      this.displayNulls = [...new Set(randChoiceNum(this.nulls, 3).filter(i => i))]
      this.myPetId = this.displayNulls[Math.floor(Math.random() * this.displayNulls.length)]?.pet_id
    },
    async handleCombat() {
      if (!this.myPetId) return this.$message.error('Please choose your nulls before the combat.')

      const { timestamp, status } = await this.wallet.getLatestBlockTimestamp()
      if (!status) return this.$message.error('Could not get latest block time, please try again.')

      this.combatKey = `Combat-${guid()}`
      await this.wallet.approveAndSend({
        handle: 'Combat',
        approveContract: this.tokenContract,
        approveChecker: this.arena.tickets * 10,
        component: this,
        transcationFactory: async () => {
          console.log(this.arena.item_id, this.myPetId, timestamp + 1800)
          return await this.rankManagerContract['pk'](this.arena.item_id, this.myPetId, timestamp + 1800)
        },
        transcationOptions: {
          key: this.combatKey,
          statusProps: 'combating',
          beforeStart: () => {
            this.$emit('combatStart', { petId: this.myPetId })
          },
          onStart: (transcation) => {
            this.combatTranscation = transcation.hash
            this.$emit('combatApproving', { petId: this.myPetId, pkTx: transcation.hash })
          },
          onComplete: (transcation) => {
            this.$emit('combatApproved', { petId: this.myPetId })
          },
          onError: (err) => {
            this.$emit('combatEnd', { petId: this.myPetId })
            this.$emit('combatFailed', { petId: this.myPetId, result: WALLET_ERRORS[err.code] || 'BlockChain Error' })
          },
          messages: {
            startTitle: 'Request to start the combat... 🔮',
            startContent: 'The battle is about to start, please go to the wallet to confirm. 📑',
            waitingTitle: 'Waiting for combat requests. 📑',
            successTitle: 'The Combat has begun! 🔥🔥🔥',
            successContent: `The combat has begun, please wait for the result. 💪`,
            errorTitle: 'Challenge failed ❌'
          }
        }
      })
    }
  }
}
</script>


<style scoped>
.color-button {
  height: 46px;
  font-size: 18px;
}

.my-nulls-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 700px;
  height: 400px;
  overflow: auto;
}

.arena-container {
  min-width: 400px;
  padding: 20px 40px;
}

.arena-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #111111;
  line-height: 40px;
}

.arena-introduce {
  font-size: 16px;
  padding: 15px;
  text-align: center;
  vertical-align: middle;
}

.nulls {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #fff4c31a;
  border: 2px solid #ff742733;
  padding: 20px;
  flex-direction: column;
  cursor: pointer;
  transition: 0.2s ease;
  margin: 15px;
  height: 220px;
  width: 170px;
}

.nulls:hover {
  transform: scale(0.95);
  filter: brightness(0.95);
}

.nulls:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}

.nulls-selected {
  background-color: #fff4c3;
  border: 2px solid #ff7427;
}

.arena-id {
  padding: 4px 8px;
  color: #ffffff;
  border-radius: 8px;
  font-size: 14px;
}

.nulls-id {
  padding: 2px 4px;
  color: #ffffff;
  border-radius: 8px;
  font-size: 12px;
  margin-left: 4px;
}
</style>