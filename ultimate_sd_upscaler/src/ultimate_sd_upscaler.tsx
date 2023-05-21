import React, { ReactEventHandler } from 'react'
import ReactDOM from 'react-dom/client'

import { action, makeAutoObservable, reaction, toJS } from 'mobx'
import { Provider, inject, observer } from 'mobx-react'

import { SliderType, SpMenu, SpSliderWithLabel } from './elements'

import * as sdapi from '../../sdapi_py_re'
import { storeAnnotation } from 'mobx/dist/internal'

import { ui_config } from './config'

export let script_name: string = 'Ultimate SD upscale'

interface UltimateSDUpscalerData {
    _: string
    tile_width: number
    tile_height: number
    mask_blur: number
    padding: number
    seams_fix_width: number
    seams_fix_denoise: number
    seams_fix_padding: number
    upscaler_index: number
    save_upscaled_image: boolean
    redraw_mode: number
    save_seams_fix_image: boolean
    seams_fix_mask_blur: number
    seams_fix_type: number
    target_size_type: number
    custom_width: number
    custom_height: number
    custom_scale: number
}
export const script_args_ordered = [
    '_',
    'tile_width',
    'tile_height',
    'mask_blur',
    'padding',
    'seams_fix_width',
    'seams_fix_denoise',
    'seams_fix_padding',
    'upscaler_index',
    'save_upscaled_image',
    'redraw_mode',
    'save_seams_fix_image',
    'seams_fix_mask_blur',
    'seams_fix_type',
    'target_size_type',
    'custom_width',
    'custom_height',
    'custom_scale',
]

class UltimateSDUpscalerStore {
    data: UltimateSDUpscalerData
    // test_value: number = 10
    // test_value_2: number = 2
    test_value: number
    test_value_2: number
    is_active: boolean
    constructor(data: UltimateSDUpscalerData) {
        this.data = data
        this.test_value = 10
        this.test_value_2 = 2
        this.is_active = false
        makeAutoObservable(this)

        // reaction(
        //     () => [this.test_value],
        //     () => {
        //         this.test_value_2 = this.test_value * 2
        //         console.log('reaction to test_value change:', this.test_value)
        //         console.log('this.test_value_2:', this.test_value_2)
        //     }
        // )
    }
    setIsActive(b_value: boolean) {
        this.is_active = b_value
    }
    setTestValue(new_value: number) {
        this.test_value = new_value
        console.log('setTestValue: new_value ', new_value)
        console.log('setTestValue: this.test_value: ', this.test_value)
    }

    updateProperty(key: keyof UltimateSDUpscalerData, value: any) {
        ;(this.data as any)[key] = value
    }

    toJsFunc() {
        return toJS(this)
    }
}

const configValues = Object.entries(ui_config).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value.value }),
    {}
)
const default_values: any = {
    _: '',
    ...configValues,
}
export const ultimate_sd_upscaler_store = new UltimateSDUpscalerStore(
    default_values
)

@observer
export class UltimateSDUpscalerForm extends React.Component<{
    store: UltimateSDUpscalerStore
}> {
    // slider1Ref = React.createRef<SpSliderWithLabel>()
    // slider2Ref = React.createRef<SpSliderWithLabel>()
    state = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        sd_upscalers: [],
    }
    componentDidMount(): void {
        this.getUpscalers()
    }
    handleUpdateItems = () => {
        this.setState({
            items: ['New Item 1', 'New Item 2', 'New Item 3'],
        })
    }
    handleSlider1ValueChange = (newValue: any) => {
        // this.props.store.setTestValue(newValue)
        this.props.store.test_value = newValue

        // this.props.store.
        console.log('store.test_value: ', this.props.store.test_value)
        console.log('newValue: ', newValue)
    }

    handleSlider2ValueChange = (newValue: any) => {
        // scriptFormStore.setSlider2Value(newValue)
    }
    handleSliderChange = (key: any, newValue: any) => {
        this.props.store.updateProperty(key, newValue)
    }
    handleMenuChange = (key: any, new_index_value_pair: any) => {
        let config = ui_config[key as keyof typeof ui_config] as any
        if ('type' in config) {
            let value =
                config.type === 'index'
                    ? new_index_value_pair['index']
                    : new_index_value_pair['item']
            this.props.store.updateProperty(key, value)
        }
    }

    async getUpscalers() {
        const sd_upscalers_json = await sdapi.requestGetUpscalers()
        const sd_upscalers = sd_upscalers_json.map(
            (upscaler: any) => upscaler.name
        )
        this.setState({ sd_upscalers: sd_upscalers })
        return sd_upscalers
    }

    render() {
        const ids = [
            'tile_width',
            'tile_height',
            'mask_blur',
            'padding',
        ] as const
        // let config = ui_config[ids as keyof typeof ui_config] as any
        const group_1_sliders = ids.map((id) => (
            <SpSliderWithLabel
                key={id}
                id={id}
                show-value={false}
                steps={ui_config[id].step}
                out_min={ui_config[id].minimum}
                out_max={ui_config[id].maximum}
                output_value={ui_config[id].value}
                title="this is a title"
                label={ui_config[id].label}
                onSliderChange={this.handleSliderChange}
            />
        ))
        const seamfix_ids = [
            'seams_fix_denoise',
            'seams_fix_width',
            'seams_fix_mask_blur',
            'seams_fix_padding',
        ] as const
        const seamfix_sliders = seamfix_ids.map((id) => (
            <SpSliderWithLabel
                key={id}
                id={id}
                show-value={false}
                steps={ui_config[id].step}
                out_min={ui_config[id].minimum}
                out_max={ui_config[id].maximum}
                output_value={ui_config[id].value}
                title="this is a title"
                label={ui_config[id].label}
                onSliderChange={this.handleSliderChange}
                slider_type={
                    Number.isInteger(ui_config[id].step)
                        ? SliderType.Integer
                        : SliderType.Float
                }
            />
        ))
        return (
            <div>
                <SpMenu
                    title="Stable Diffusion Upscalers"
                    items={this.state.sd_upscalers}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select Upscaler"
                    id={'upscaler_index'}
                    onChange={this.handleMenuChange}
                />
                {group_1_sliders}
                {seamfix_sliders}
                <SpMenu
                    title=""
                    id={'target_size_type'}
                    items={ui_config.target_size_type.choices}
                    label_item={'Select ' + ui_config.target_size_type.label}
                    onChange={this.handleMenuChange}
                    // style="width: 199px; margin-right: 5px"
                />
                <SpSliderWithLabel
                    label={ui_config.custom_scale.label}
                    output_value={this.props.store.data.custom_scale}
                    id={'custom_scale'}
                    out_min={ui_config.custom_scale.minimum}
                    out_max={ui_config.custom_scale.maximum}
                    onSliderChange={this.handleSliderChange}
                    steps={0.01}
                    slider_type={SliderType.Float}
                />
                <SpMenu
                    title="Seams Fix Type"
                    id={'seams_fix_type'}
                    items={ui_config.seams_fix_type.choices}
                    label_item="Select Seams Fix Type"
                    onChange={this.handleMenuChange}
                    // style="width: 199px; margin-right: 5px"
                />
                <sp-checkbox
                    checked={
                        this.props.store.data.save_upscaled_image
                            ? true
                            : undefined
                    }
                    onClick={(event: React.ChangeEvent<HTMLInputElement>) => {
                        this.props.store.updateProperty(
                            'save_upscaled_image',
                            event.target.checked
                        )
                    }}
                >
                    {ui_config.save_upscaled_image.label}
                </sp-checkbox>
                <sp-checkbox
                    checked={
                        this.props.store.data.save_seams_fix_image
                            ? true
                            : undefined
                    }
                    onClick={(event: React.ChangeEvent<HTMLInputElement>) => {
                        this.props.store.updateProperty(
                            'save_seams_fix_image',
                            event.target.checked
                        )
                    }}
                >
                    {ui_config.save_seams_fix_image.label}
                </sp-checkbox>
                \
            </div>
        )
    }
}
