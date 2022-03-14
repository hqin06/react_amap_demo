import React, { useRef, useState, useEffect } from 'react';
import { Map as AMap, Marker, MouseTool, Polygon, PolyEditor } from 'react-amap';
import _ from 'lodash';
import { Button, Input } from 'antd'
import 'antd/dist/antd.css';


export default function (props: any) {
  const [textInfo, setTextInfo] = useState('');
  const [selfTool, setselfTool] = useState();
  const [map, setmap] = useState(null);

  const [path, setPath] = useState([]);
  const [polygonActive, setpolygonActive] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [label, setLabel] = useState('');

  const [loading, setLoading] = useState(false);
  const [initData, setInitData] = useState(null);

  const showStyle = {
    strokeColor: '#FF33FF',
    strokeWeight: 6,
    strokeOpacity: 0.2,
    fillColor: '#1791fc',
    fillOpacity: 0.4,
    // 线样式还支持 ' dashed'
    strokeStyle: 'solid',
    // strokeStyle是dashed时有效
    // strokeDasharray: [30,10],
  };

  useEffect(() => {
    queryData();
  }, [props]);

  const queryData = async () => {
    setLoading(true);
    try {
      setPath([]);
    } catch (error) {
      console.log(error, 'error');
    } finally {
      setLoading(false);
    }
  };
  const drawPolygon = () => {
    if (selfTool) {
      selfTool.polygon(showStyle);
    }
  };
  const drawWhat = async obj => {
    let text = '';
    switch (obj.CLASS_NAME) {
      case 'AMap.Marker':
        text = `你绘制了一个标记，坐标位置是 {${obj.getPosition()}}`;
        break;
      case 'AMap.Polygon':
        text = `你绘制了一个多边形，有${obj.getPath().length}个端点`;
        break;
      case 'AMap.Circle':
        text = `你绘制了一个圆形，圆心位置为{${obj.getCenter()}}`;
        break;
      default:
        text = '';
    }
    await setTextInfo(text);
    await setPath(_.compact(_.concat(path, [obj.getPath()])));
    await map.setFitView([_.last(map.getAllOverlays('polygon'))]);
    if (selfTool) {
      selfTool.close(true);
    }
    startEditPolygon();
  };
  const close = () => {
    if (selfTool) {
      selfTool.close();
    }
    setTextInfo("关闭了鼠标工具");
    closeEditPolygon();
  };
  const submit = async () => {
    console.log(path, 'path');
  };
  // 开始编辑
  const startEditPolygon = () => {
    setpolygonActive(true);
  };
  // 结束编辑
  const closeEditPolygon = () => {
    setpolygonActive(false);
  };

  const clear = () => {
    setPath([]);
  };

  const search = (val: any) => {
    map.plugin('AMap.PlaceSearch', () => {
      const place = new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
      });
      // 进行搜索
      place.search(val, (status: any, result: any) => {
        const { info, poiList } = result;
        if (result.length) {
          return;
        }
        if (info !== 'OK') {
          return;
        }
        if (poiList.pois && Array.isArray(poiList.pois)) {
          let lnglat = _.head(poiList.pois).location;
          setMarkerPosition(lnglat);
          map.setFitView();
          //点是否在多边形内
          var isPointInRing = false;
          if (path && path.length) {
            path.forEach(element => {
              let isPointInRing2 = window.AMap.GeometryUtil.isPointInRing(lnglat, [element]);
              if (isPointInRing2) {
                isPointInRing = isPointInRing2;
                return;
              }
            });
          }
          setLabel({
            content: isPointInRing ? '内部' : '外部',
            offset: new window.AMap.Pixel(20, 0),
          });
        }
      });
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          height: 60,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Input.Search
          placeholder="请输入地址"
          enterButton="查询"
          onSearch={value => search(value)}
          style={{ display: 'inline-block', width: 400, marginRight: 10 }}
        />
        <Button type="default" onClick={startEditPolygon} style={{ marginRight: 10 }}>
          开始编辑
        </Button>
        <Button type="default" onClick={closeEditPolygon} style={{ marginRight: 10 }}>
          结束编辑
        </Button>
        <Button
          type="primary"
          onClick={drawPolygon}
          style={{ marginRight: 10 }}
        >
          开启绘制
        </Button>
        <Button type="default" onClick={close} style={{ marginRight: 10 }}>
          结束绘制
        </Button>
        <Button type="default" onClick={clear} style={{ marginRight: 10 }}>
          清除所有覆盖区域
        </Button>
      </div>
      <div style={{ width: '100%', height: 'calc(100% - 60px)', }}>
        <div style={{ width: '100%', height: '100%' }}>
          <AMap
            zoom={10}
            plugins={['ToolBar']}
            amapkey={'d3abe9ef326afad3d6041096f694a1e8'}
            events={{
              created: (mapinst: any) => {
                setmap(mapinst);
              },
            }}
          >
            {markerPosition ? <Marker position={markerPosition} label={label} /> : ''}
            <MouseTool
              events={{
                created: (tool: any) => {
                  setselfTool(tool);
                },
                draw({ obj }: any) {
                  drawWhat(obj);
                },
              }}
            />
            <Polygon path={path} visible={path ? true : false} style={showStyle}>
              <PolyEditor
                active={polygonActive}
                events={{
                  created: () => { },
                  addnode: () => { },
                  adjust: () => { },
                  removenode: () => { },
                  end: (event: any) => {
                    setPath(event.target.getPath());
                  },
                }}
              />
            </Polygon>
          </AMap>
        </div>
      </div>
    </div >
  );
}
