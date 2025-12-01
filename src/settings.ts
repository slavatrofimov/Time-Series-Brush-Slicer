/*
 *  Power BI Visualizations - Time Series Brush Slicer Settings
 */

"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import FormattingSettingsGroup = formattingSettings.Group;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;

/**
 * Brush Settings Card
 */
class BrushSettingsCard extends FormattingSettingsCard {
    brushColor = new formattingSettings.ColorPicker({
        name: "brushColor",
        displayName: "Brush Color",
        description: "Color of the brush selection area",
        value: null // Dynamic: defaults to Theme Color 1
    });

    brushOpacity = new formattingSettings.NumUpDown({
        name: "brushOpacity",
        displayName: "Brush Opacity",
        description: "Opacity of the brush selection (0-100)",
        value: 30,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100
            }
        }
    });

    name: string = "brushSettings";
    displayName: string = "Brush Settings";
    slices: Array<FormattingSettingsSlice> = [this.brushColor, this.brushOpacity];
}

/**
 * Area Settings Card
 */
class AreaSettingsCard extends FormattingSettingsCard {
    showAreaChart = new formattingSettings.ToggleSwitch({
        name: "showAreaChart",
        displayName: "Show Area Chart",
        description: "Display values as an area chart behind the brush",
        value: true
    });

    areaColor = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Area Color",
        description: "Color of the area chart",
        value: { value: "#118DFF" },
        selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
        instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
    });

    areaOpacity = new formattingSettings.NumUpDown({
        name: "areaOpacity",
        displayName: "Area Opacity",
        description: "Opacity of the area chart (0-100)",
        value: 50,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100
            }
        }
    });

    name: string = "areaSettingsGroup";
    displayName: string = "Area Settings";
    slices: Array<FormattingSettingsSlice> = [this.showAreaChart, this.areaColor, this.areaOpacity];
}

/**
 * Line Settings Card
 */
class LineSettingsCard extends FormattingSettingsCard {
    lineColor = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Line Color",
        description: "Color of the line on the chart",
        value: { value: "#01B8AA" },
        selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
        instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
    });

    lineWidth = new formattingSettings.NumUpDown({
        name: "lineWidth",
        displayName: "Line Width",
        description: "Width of the line",
        value: 1.5,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0.5
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 10
            }
        }
    });

    name: string = "dataPoint";
    displayName: string = "Line Settings";
    slices: Array<FormattingSettingsSlice> = [this.lineColor, this.lineWidth];
}

/**
 * Time Axis Settings Card
 */
class AxisSettingsCard extends FormattingSettingsCard {
    showAxis = new formattingSettings.ToggleSwitch({
        name: "showAxis",
        displayName: "Show Time Axis",
        description: "Display the time axis below the chart",
        value: true
    });

    axisColor = new formattingSettings.ColorPicker({
        name: "axisColor",
        displayName: "Axis Color",
        description: "Color of the axis labels and ticks",
        value: { value: "#666666" }
    });

    axisFontSize = new formattingSettings.NumUpDown({
        name: "axisFontSize",
        displayName: "Axis Font Size",
        description: "Font size for the axis labels",
        value: 10,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 8
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 40
            }
        }
    });

    axisFontFamily = new formattingSettings.FontPicker({
        name: "axisFontFamily",
        displayName: "Axis Font Family",
        description: "Font family for the axis labels",
        value: "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif"
    });

    name: string = "axisSettingsGroup";
    displayName: string = "Time Axis Settings";
    slices: Array<FormattingSettingsSlice> = [this.showAxis, this.axisColor, this.axisFontSize, this.axisFontFamily];
}

/**
 * Y Axis Settings Card
 */
class YAxisSettingsCard extends FormattingSettingsCard {
    yAxisMin = new formattingSettings.TextInput({
        name: "yAxisMin",
        displayName: "Y Axis Min",
        description: "Minimum value for the Y axis (leave empty for auto)",
        value: "",
        placeholder: "Auto"
    });

    yAxisMax = new formattingSettings.TextInput({
        name: "yAxisMax",
        displayName: "Y Axis Max",
        description: "Maximum value for the Y axis (leave empty for auto)",
        value: "",
        placeholder: "Auto"
    });

    showZeroLine = new formattingSettings.ToggleSwitch({
        name: "showZeroLine",
        displayName: "Show Zero Line",
        description: "Display a horizontal line at 0",
        value: true
    });

    zeroLineColor = new formattingSettings.ColorPicker({
        name: "zeroLineColor",
        displayName: "Zero Line Color",
        description: "Color of the zero line",
        value: { value: "#333333" }
    });

    zeroLineStrokeWidth = new formattingSettings.NumUpDown({
        name: "zeroLineStrokeWidth",
        displayName: "Zero Line Stroke Width",
        description: "Width of the zero line",
        value: 1,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 10
            }
        }
    });

    name: string = "yAxisSettingsGroup";
    displayName: string = "Y Axis Settings";
    slices: Array<FormattingSettingsSlice> = [this.yAxisMin, this.yAxisMax, this.showZeroLine, this.zeroLineColor, this.zeroLineStrokeWidth];
}

/**
 * Margin Settings Card
 */
class MarginSettingsCard extends FormattingSettingsCard {
    marginTop = new formattingSettings.NumUpDown({
        name: "marginTop",
        displayName: "Top (px)",
        value: 0,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    marginRight = new formattingSettings.NumUpDown({
        name: "marginRight",
        displayName: "Right (px)",
        value: 5,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    marginBottom = new formattingSettings.NumUpDown({
        name: "marginBottom",
        displayName: "Bottom (px)",
        value: 0,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    marginLeft = new formattingSettings.NumUpDown({
        name: "marginLeft",
        displayName: "Left (px)",
        value: 5,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    marginPadding = new formattingSettings.MarginPadding({
        name: "marginPadding",
        displayName: "Margins",
        left: this.marginLeft,
        right: this.marginRight,
        top: this.marginTop,
        bottom: this.marginBottom
    });

    name: string = "marginSettingsGroup";
    displayName: string = "Margin Settings";
    slices: Array<FormattingSettingsSlice> = [this.marginPadding];
}

/**
 * Display Settings Card
 */
class DisplaySettingsCard extends FormattingSettingsCard {
    showSelectedRange = new formattingSettings.ToggleSwitch({
        name: "showSelectedRange",
        displayName: "Show Selected Range",
        description: "Display the selected time range text",
        value: true
    });

    dateFormat = new formattingSettings.TextInput({
        name: "dateFormat",
        displayName: "Display Date Format",
        description: "Format for displaying dates (e.g., MMM d, yyyy HH:mm:ss)",
        value: "MMM d, yyyy HH:mm:ss",
        placeholder: "MMM d, yyyy HH:mm:ss"
    });

    prefix = new formattingSettings.TextInput({
        name: "prefix",
        displayName: "Prefix",
        description: "Text to display before the selected range",
        value: "Effective Range",
        placeholder: "Effective Range"
    });

    fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        displayName: "Font Family",
        description: "Font family for the selected range text",
        value: "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif"
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        description: "Font size for the selected range text",
        value: 12,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 8
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 40
            }
        }
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        description: "Color of the selected range text",
        value: { value: "#333333" }
    });

    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background Color",
        description: "Background color of the selected range text area",
        value: { value: "#f0f0f0" }
    });

    alignment = new formattingSettings.AlignmentGroup({
        name: "alignment",
        displayName: "Alignment",
        mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
        value: "center"
    });

    // Margin Settings
    rangeTextMarginTop = new formattingSettings.NumUpDown({
        name: "rangeTextMarginTop",
        displayName: "Top (px)",
        value: 0,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    rangeTextMarginRight = new formattingSettings.NumUpDown({
        name: "rangeTextMarginRight",
        displayName: "Right (px)",
        value: 5,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    rangeTextMarginBottom = new formattingSettings.NumUpDown({
        name: "rangeTextMarginBottom",
        displayName: "Bottom (px)",
        value: 0,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    rangeTextMarginLeft = new formattingSettings.NumUpDown({
        name: "rangeTextMarginLeft",
        displayName: "Left (px)",
        value: 5,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 200
            }
        }
    });

    rangeTextMarginPadding = new formattingSettings.MarginPadding({
        name: "rangeTextMarginPadding",
        displayName: "Margins",
        left: this.rangeTextMarginLeft,
        right: this.rangeTextMarginRight,
        top: this.rangeTextMarginTop,
        bottom: this.rangeTextMarginBottom
    });

    name: string = "displaySettings"; // Keeping the name consistent
    displayName: string = "Display Settings";
    
    slices: Array<FormattingSettingsSlice> = [
        this.showSelectedRange, 
        this.prefix,
        this.dateFormat, 
        this.fontFamily,
        this.fontSize, 
        this.fontColor, 
        this.backgroundColor, 
        this.alignment,
        this.rangeTextMarginPadding
    ];
}

/**
 * Anomalies Settings Card
 */
class AnomaliesSettingsCard extends FormattingSettingsCard {
    markerType = new formattingSettings.ItemDropdown({
        name: "markerType",
        displayName: "Marker Type",
        items: [
            { displayName: "Circle", value: "circle" },
            { displayName: "Square", value: "square" },
            { displayName: "Triangle", value: "triangle" },
            { displayName: "Diamond", value: "diamond" }
        ],
        value: { displayName: "Circle", value: "circle" }
    });

    markerSize = new formattingSettings.NumUpDown({
        name: "markerSize",
        displayName: "Marker Size",
        value: 5,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 1
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 50
            }
        }
    });

    markerColor = new formattingSettings.ColorPicker({
        name: "markerColor",
        displayName: "Marker Color",
        value: { value: "#FF0000" }
    });

    markerOpacity = new formattingSettings.NumUpDown({
        name: "markerOpacity",
        displayName: "Marker Opacity",
        description: "Opacity of the markers (0-100)",
        value: 80,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100
            }
        }
    });

    name: string = "anomaliesSettings";
    displayName: string = "Anomalies Settings";
    slices: Array<FormattingSettingsSlice> = [this.markerType, this.markerSize, this.markerColor, this.markerOpacity];
}

/**
 * Timeline Markers Settings Card
 */
class TimelineMarkerSettingsCard extends FormattingSettingsCard {
    lineColor = new formattingSettings.ColorPicker({
        name: "lineColor",
        displayName: "Line Color",
        value: { value: "#000000" }
    });

    lineWidth = new formattingSettings.NumUpDown({
        name: "lineWidth",
        displayName: "Line Width",
        value: 1,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 20
            }
        }
    });

    lineOpacity = new formattingSettings.NumUpDown({
        name: "lineOpacity",
        displayName: "Line Opacity",
        description: "Opacity of the timeline marker lines (0-100)",
        value: 100,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100
            }
        }
    });

    markerType = new formattingSettings.ItemDropdown({
        name: "markerType",
        displayName: "Marker Type",
        items: [
            { displayName: "Triangle Down", value: "triangleDown" },
            { displayName: "Triangle Up", value: "triangleUp" },
            { displayName: "Circle", value: "circle" },
            { displayName: "Square", value: "square" }
        ],
        value: { displayName: "Triangle Down", value: "triangleDown" }
    });

    markerSize = new formattingSettings.NumUpDown({
        name: "markerSize",
        displayName: "Marker Size",
        value: 8,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 1
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 50
            }
        }
    });

    markerColor = new formattingSettings.ColorPicker({
        name: "markerColor",
        displayName: "Marker Color",
        value: { value: "#000000" }
    });

    markerOpacity = new formattingSettings.NumUpDown({
        name: "markerOpacity",
        displayName: "Marker Opacity",
        description: "Opacity of the markers (0-100)",
        value: 80,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100
            }
        }
    });

    markerPosition = new formattingSettings.ItemDropdown({
        name: "markerPosition",
        displayName: "Marker Position",
        items: [
            { displayName: "Top", value: "top" },
            { displayName: "Bottom", value: "bottom" }
        ],
        value: { displayName: "Top", value: "top" }
    });

    name: string = "timelineMarkerSettings";
    displayName: string = "Timeline Markers Settings";
    slices: Array<FormattingSettingsSlice> = [
        this.lineColor, 
        this.lineWidth, 
        this.lineOpacity,
        this.markerType, 
        this.markerSize, 
        this.markerColor, 
        this.markerOpacity,
        this.markerPosition
    ];
}

/**
 * Series Settings Card - Dynamic card for series colors
 */
class SeriesSettingsCard extends FormattingSettingsCard {
    name: string = "seriesColor";
    displayName: string = "Series Colors";
    slices: Array<FormattingSettingsSlice> = [];
}

/**
 * Output Settings Card - Controls the text output format
 */
class OutputSettingsCard extends FormattingSettingsCard {
    delimiter = new formattingSettings.TextInput({
        name: "delimiter",
        displayName: "Delimiter",
        description: "Character(s) to separate start and end timestamps",
        value: "|",
        placeholder: "|"
    });

    outputFormat = new formattingSettings.TextInput({
        name: "outputFormat",
        displayName: "Output Date Format",
        description: "Date format for the output string (if not using ISO)",
        value: "yyyy-MM-dd HH:mm:ss",
        placeholder: "yyyy-MM-dd HH:mm:ss"
    });

    useISOFormat = new formattingSettings.ToggleSwitch({
        name: "useISOFormat",
        displayName: "Use ISO 8601 Format",
        description: "Output dates in ISO 8601 format (recommended for M queries)",
        value: true
    });

    name: string = "outputSettings";
    displayName: string = "Output Settings";
    slices: Array<FormattingSettingsSlice> = [this.useISOFormat, this.outputFormat, this.delimiter];
}

/**
 * Visual Settings Model
 */
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    brushSettingsCard = new BrushSettingsCard();
    lineSettingsCard = new LineSettingsCard();
    areaSettingsCard = new AreaSettingsCard();
    axisSettingsCard = new AxisSettingsCard();
    yAxisSettingsCard = new YAxisSettingsCard();
    marginSettingsCard = new MarginSettingsCard();
    seriesSettingsCard = new SeriesSettingsCard();
    displaySettingsCard = new DisplaySettingsCard();
    outputSettingsCard = new OutputSettingsCard();
    anomaliesSettingsCard = new AnomaliesSettingsCard();
    timelineMarkerSettingsCard = new TimelineMarkerSettingsCard();

    cards = [
        this.brushSettingsCard,
        this.lineSettingsCard,
        this.areaSettingsCard,
        this.axisSettingsCard,
        this.yAxisSettingsCard,
        this.marginSettingsCard,
        this.seriesSettingsCard,
        this.displaySettingsCard, 
        this.outputSettingsCard,
        this.anomaliesSettingsCard,
        this.timelineMarkerSettingsCard
    ];
}
