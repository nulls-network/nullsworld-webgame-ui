<template>
  <a-spin tip="Loading..." :spinning="approving || hatching">
    <div class="eggs-container">
      <div class="eggs-title">Hatch eggs</div>
      <div class="eggs-introduce">nulls will treat the first person they see as a parent</div>
      <NeedWalletConnect
        @onWalletConnect="init"
        @onAddressChange="init"
        @onWalletDisconnect="onDisconnect"
      >
        <div class="price-text mt-4">You have {{ formatNumber(eggBalance) }} Eggs</div>
        <div class="egg-list">
          <div
            :class="`eggs-frame ${selected == key ? 'eggs-frame-opt' : ''}`"
            v-for="(item, key) in list"
            :key="key"
            @click="select(key, item)"
          >
            <img class="img-h" :src="`/${item.img}`" />
          </div>
        </div>

        <div class="egg-count-wrap mt-8">
          <p class="title">Number of dinosaur eggs (default: 1)</p>
          <div class="flex egg-count-inner">
            <div class="flex" @click="handleClickQuantity">
              <span
                :class="{
                  active: !isInputQuantity && openEggAmount == quantityItem.label
                }"
                v-for="quantityItem in quantityList"
                :key="quantityItem.label"
              >{{ quantityItem.label }}</span>
            </div>
            <input
              v-model="quantity"
              @focus="isInputQuantity = true"
              @blur="quantity === '' && (isInputQuantity = false)"
              @input="quantityChange"
              type="text"
              :class="[
                'quantity-input',
                'focus:outline-none',
                'focus:shadow-outline',
                { active: isInputQuantity }
              ]"
              :style="approving || hatching ? 'pointer-events: none' : ''"
              placeholder="other"
            />
          </div>
        </div>
        <div class="flex justify-center mt-8">
          <color-button
            @click="handleHatch"
            :disabled="
              !wallet.connected || zeroEggs || insufficientEggs || approving || hatching
            "
          >
            <LoadingOutlined v-show="approving || hatching" class="px-2 font-bold" spin />
            {{
              !wallet.connected
                ? 'Wallet Not Connected'
                : insufficientEggs
                  ? 'Insufficient Eggs'
                  : zeroEggs
                    ? 'Number of eggs cannot be 0'
                    : approving
                      ? 'Approving...'
                      : hatching
                        ? 'Hatching...'
                        : `Hatch ${openEggAmount} Eggs`
            }}
          </color-button>
        </div>
      </NeedWalletConnect>
    </div>
  </a-spin>
</template>

<script>
import { NullsEggToken, NullsEggManager, CONTRACT_ADDRESS } from '@/contracts'
import { addDecimal, formatNumber, removeDecimal, calcApproveAmount } from '@/utils/common'
import { MyEggs } from '@/backends'
import { markRaw, h } from 'vue'
import { CheckCircleTwoTone, LoadingOutlined } from '@ant-design/icons-vue'
import { WALLET_ERRORS, WALLET_TIPS } from '@/utils/wallet/constants'

export default {
  components: {
    LoadingOutlined
  },
  data() {
    return {
      addDecimal,
      formatNumber,
      removeDecimal,
      maxOpen: 20,
      selected: '0',
      width: '287px',
      list: [
        {
          img: 'egg1.png'
        }
      ],

      quantity: '',
      isInputQuantity: false,
      hatching: false,
      approving: false,
      openEggAmount: 1,

      eggBalance: 0,
      eggContract: markRaw({}),
      eggManagerContract: markRaw({}),
      updateBalanceInterval: undefined
    }
  },
  async created() {
    await this.init()
  },
  unmounted() {
    clearInterval(this.updateBalanceInterval)
  },
  watch: {
    quantity(newVal) {
      const v = Number(newVal.replace(/[^\d]/g, '') || 1)
      this.openEggAmount = v > 20 ? 20 : v
    }
  },
  computed: {
    insufficientEggs() {
      return !this.eggBalance || this.openEggAmount > this.eggBalance
    },
    zeroEggs() {
      return this.openEggAmount < 1
    },
    quantityList() {
      return [
        {
          label: 1
        },
        {
          label: 5
        },
        {
          label: 10
        },
        {
          label: 20
        }
      ]
    }
  },
  methods: {
    async init() {
      if (!this.wallet.address) return
      clearInterval(this.updateBalanceInterval)

      // Create contracts
      this.eggContract = markRaw(this.wallet.createContract(NullsEggToken))
      this.eggManagerContract = markRaw(this.wallet.createContract(NullsEggManager))

      this.eggManagerContract.on('EggNewNonce', (...args) => {
        const event = args.slice(-1)
        console.log('EggNewNonce event:', event)
      })
      this.eggManagerContract.on('NewPet', (...args) => {
        const event = args.slice(-1)
        console.log('NewPet event:', event)
      })

      await this.updateEggBalance()
      this.updateBalanceInterval = setInterval(this.updateEggBalance, 10_000)
    },
    onDisconnect() {
      clearInterval(this.updateBalanceInterval)
    },
    async updateEggBalance() {
      this.eggBalance = Number(await this.eggContract['balanceOf'](this.wallet.address))
    },
    select(key) {
      this.selected = key
    },
    async readyOpenEggs() {
      const latestBlock = await this.wallet.signer.provider.getBlock()
      const { code, data } = (await MyEggs.getItemId()).data
      if (code !== 200) {
        return { err: 'Could not get itemId, please try again.' }
      }
      return {
        itemId: data.item_id,
        deadline: latestBlock.timestamp + 1800,
        err: undefined
      }
    },
    async handleHatch() {
      if (!this.eggBalance) return

      // Check allowance
      const allowance = await this.eggContract['allowance'](this.wallet.address, CONTRACT_ADDRESS.TransferProxy)

      // Approve if need
      if (allowance.lt(this.openEggAmount)) {
        this.approving = true
        let hiedeApprovingHint = this.$message.loading({
          content: 'Approving required, waiting for your approval',
          key: 'approving',
          duration: 0
        })
        try {
          const approveTx = await this.eggContract['approve'](
            CONTRACT_ADDRESS.TransferProxy,
            calcApproveAmount()
          )
          hiedeApprovingHint = this.$message.loading({
            content: WALLET_TIPS.txSend,
            key: 'approving',
            duration: 0
          })
          await approveTx.wait().then((receipt) => {
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
          this.$message.error(
            WALLET_ERRORS[err.code] || err.data?.message || err.message
          )
          this.approving = false
          return
        }
      }

      // Handle buy eggs
      const { itemId, deadline, err } = await this.readyOpenEggs()
      if (err) return this.$message.error(err)

      // Hatch
      let hideOpeningHint = this.$message.loading({
        content: 'Awaiting approval of transaction',
        key: 'hatching',
        duration: 0
      })
      this.hatching = true
      try {
        const openEggsTx = await this.eggManagerContract['openMultiple'](
          this.openEggAmount,
          /* itemId: */ 8,
          deadline
        )
        hideOpeningHint = this.$message.loading({
          content: WALLET_TIPS.txSend,
          key: 'hatching',
          duration: 0
        })
        await openEggsTx.wait().then((receipt) => {
          console.log(receipt)
          if (receipt.status === 1) {
            console.log(`===============openEggsTx==================`)
            this.hatching = false
            hideOpeningHint()
            this.updateEggBalance()
            this.$notification.open({
              message: 'Successful hatching',
              description: `Successful hatching of ${this.openEggAmount} eggs, please check in MyNulls!`,
              icon: h(CheckCircleTwoTone, { twoToneColor: '#52c41a' })
            })
          }
        })
      } catch (err) {
        hideOpeningHint()
        console.error(err)
        this.$message.error(WALLET_ERRORS[err.code] || err.data?.message || err.message)
        this.hatching = false
      }
    },
    quantityChange() {
      let value = this.quantity.replace(/[^\d]/g, '')
      this.quantity = +value > 20 ? '20' : value
    },
    handleClickQuantity(e) {
      if (e.target.tagName.toLowerCase() === 'span') {
        this.isInputQuantity = false
        this.openEggAmount = e.target.innerText
      }
    }
  }
}
</script>

<style lang="less" scoped>
.eggs-container {
  padding: 20px 40px;
}

.eggs-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #111111;
  line-height: 40px;
}

.egg-list {
  margin-top: 23px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.eggs-frame {
  width: 170px;
  height: 188px;
  border-radius: 10px;
  border: 2px solid #e3d0c3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin: 10px 10px;
  transition: 0.2s ease;
}

.img-h {
  height: 126px;
}

.eggs-frame:hover {
  background-color: #fff2ea;
}

.eggs-frame:hover img {
  /* animation: shake 2s 0.15s ease-in-out infinite; */
}

.eggs-frame:active {
  border-color: #ff7427;
  transform: scale(0.95);
}

.eggs-frame:active .img-h {
  filter: brightness(0.9);
}

.eggs-frame-opt {
  background-color: #fff2ea;
  border: 2px solid #ff7427;
}

.eggs-introduce {
  font-size: 16px;
  padding: 15px;
  text-align: center;
}

@keyframes shake {
  10% {
    transform: scale(1.1) rotate(15deg);
  }
  20% {
    transform: scale(1.1) rotate(-10deg);
  }
  30% {
    transform: scale(1.1) rotate(5deg);
  }
  40% {
    transform: scale(1.1) rotate(-5deg);
  }
  50%,
  100% {
    transform: rotate(0deg);
  }
}

.color-button {
  height: 46px;
  font-size: 18px;
}

.price-text {
  text-align: center;
  font-weight: bold;
  font-size: 18px;
  color: #ff7427;
}

.egg-count-wrap {
  .title {
    margin-bottom: 10px;
    font-size: 18px;
    color: #00367f;
  }

  .egg-count-inner {
    span {
      margin-right: 25px;
      width: 57px;
      height: 34px;
      line-height: 34px;
      color: #111;
      font-size: 18px;
      text-align: center;
      border-radius: 8px;
      border: 1px solid #aaa;
      cursor: pointer;

      &.active {
        color: #ff7427;
        border-color: #ff7427;
      }
    }

    .quantity-input {
      width: 57px;
      height: 34px;
      padding: 5px 10px;
      font-size: 18px;
      border-radius: 8px;
      border: 1px solid #aaa;
      background: transparent;
      text-align: center;

      &.active {
        color: #ff7427;
        border-color: #ff7427;
      }
    }
  }
}
</style>
