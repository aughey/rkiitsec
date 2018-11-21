import React, {Component} from 'react';
import Chartist from 'chartist'
import sensordata_in from './data.json'
import "chartist/dist/chartist.css";
import osc from 'osc/dist/osc-browser'
import Gauge from 'react-svg-gauge';
import BusinessLogic from './BusinessLogic';
import './App.css';

// Add one more which is AccV
function sq(a) {
  return parseFloat(a) * parseFloat(a)
}
var sensordata = sensordata_in.map((d) => {
  return {
    ...d,
    AccV: Math.sqrt(sq(d.AccX) + sq(d.AccY) + sq(d.AccZ))
  }
})

class DoWork extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      recording: false
    }
    this.recording = false; // Copy of it because the state is set within the render cycle
    this.data = []; // Data stored while we are recording

    this.logic = new BusinessLogic();
  }
  newData(data) {
    //console.log(data);
    var gyro = data.gyro;
    if (!gyro) {
      return;
    }

    this.data.push(gyro);

    if (this.recording) {
      if (this.data.length > this.logic.recordSize) {
        var d = [0, 1, 2].map((i) => this.data.map((d) => d[i]))
        this.setState({data: d, recording: false})
        this.recording = false
        var results = this.logic.processRecordedData(this.data, this.data.map(v => v[0]), this.data.map(v => v[1]), this.data.map(v => v[2]));
        // XXX Do something with the results
        this.setState({results: results});
        this.data = [];
      }
    } else {
      while (this.data.length > this.logic.preRecordSize) {
        this.data.shift(); // Remove from fifo
      }
      if (this.logic.shouldRecordingStart(gyro, this.data)) {
        this.setState({recording: true})
        this.recording = true;
      }
    }
  }
  render() {
    var graph,
      graph2;
    if (this.state.data) {
      graph = <TestGraph range={[-200,700]} labels={["GyroX", "GyroY", "GyroZ"]} datas={this.state.data}/>
    }
    console.log("render")

    var results;
    if (this.state.results) {
      if (this.state.results.text) {
        results = (<div style={{
            "fontSize" : "400%"
          }}>
          {this.state.results.text}
        </div>)
      }
      if(this.state.results.graphdata) {
        graph2 = <TestGraph labels={["Data"]} datas={[this.state.results.graphdata]}/>
      }
    }

    return (<div>
      <div>
        <div>{results}</div>
        Recording: {
          this.state.recording
            ? "YES"
            : "NO"
        }
        , Pre-Record: {this.logic.preRecordSize}
        , Record-Size: {this.logic.recordSize}

      </div>
      {graph}
      <hr/>
      {graph2}
    </div>);
  }
}

class GyroGauge extends React.PureComponent {
  render() {
    return (<Gauge color={this.props.color} value={this.props.value} min={-1000} max={1000} valueFormatter={(a) => a.toFixed(1)} width={window.innerWidth / 3.5} height={320} label={this.props.label}/>);
  }
}

class TestOSC extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accel: [
        0, 0, 0
      ],
      gyro: [0, 0, 0]
    }
    this.myRef = React.createRef();
  }
  componentDidMount() {
    var oscPort = new osc.WebSocketPort({
      url: "ws://" + window.location.hostname + ":8080", // URL to your Web Socket server.
      metadata: true
    });
    oscPort.open();
    oscPort.on("message", (msg) => {

      function filter(oldv, newv) {
        var alpha = 0.99;
        return oldv * alpha + newv * (1.0 - alpha)
      }

      var decode = (name) => {
        if (msg.address === '/' + name) {
          var obj = {};
          obj[name] = msg.args.map((a, i) => a.value); // filter(this.state[name][i], a.value))
          this.setState(obj)
          if (this.myRef.current) {
            this.myRef.current.newData(obj);
          }
        }
      }
      decode("gyro");
      decode("accel");
    })
    this.oscPort = oscPort
  }
  render() {
    return (<div>
      <ul>
        <li>Gyro:
          <ul>
            <li>{this.state.gyro[0]}</li>
            <li>{this.state.gyro[1]}</li>
            <li>{this.state.gyro[1]}</li>
          </ul>
        </li>
      </ul>
      <div>
        <GyroGauge color='red' value={this.state.gyro[0]} label="Twist (X)"/>
        <GyroGauge color='green' value={this.state.gyro[1]} label="Side (Y)"/>
        <GyroGauge color='blue' value={this.state.gyro[2]} label="Tip (Z)"/>
      </div>
      <DoWork ref={this.myRef}/>
    </div>);
  }
}

class TestGraph extends Component {
  constructor(props) {
    super(props);

    this.graphref = React.createRef();

    this.state = {}
  }
  componentDidMount() {
    var options = {
      axisX: {
        showGrid: false
      },
      showPoint: false,
      showGrid: false,
      lineSmooth: false,
      fullWidth: true
    }
    if(this.props.range) {
      options.low = this.props.range[0]
      options.high = this.props.range[1]
    }
    this.chartist = new Chartist.Line(this.graphref.current, {}, options);

    this.updateData(this.props);
  }

  updateData(props) {

    var colors = ['redgraph', 'greengraph', 'bluegraph']

    var chartdata = {
      series: props.labels.map((label, i) => {
        return {data: props.datas[i], name: label}
      })
    }

    this.chartist.update(chartdata)
  }

  componentWillReceiveProps(nextProps) {
    this.updateData(nextProps);
  }
  render() {

    return (<div>

      <div ref={this.graphref} style={{
          width: "100%",
          height: 500
        }}></div>

    </div>)
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    var fields = Object.keys(sensordata[0])
    fields = fields.filter((f) => !f.startsWith("Mag") && !f.startsWith("Time"))
    var showFields = {};
    fields.forEach(f => showFields[f] = true)
    this.state = {
      fields: fields,
      showFields: showFields
    }

  }
  changeField = (e) => {
    var newfields = {
      ...this.state.showFields
    }
    newfields[e] = !newfields[e]
    this.setState({showFields: newfields})
  }
  render() {
    //var labels = Object.keys(this.state.showFields).filter((f) => this.state.showFields[f])
    // var datas = labels.map((field) => {
    //   return sensordata.map(d => d[field]);
    // })

    // <ul>
    //   {
    //     this.state.fields.map((f) => {
    //       return (<li key={f}>
    //         <input type="checkbox" checked={this.state.showFields[f]} onChange={() => this.changeField(f)}></input>{f}</li>)
    //     })
    //   }
    // </ul>
    // <TestGraph labels={labels} datas={datas}/>
    // <pre>{JSON.stringify(sensordata.slice(0,5),null,2)}</pre>

    return (<div className="App">
      <TestOSC>
        <DoWork/>
      </TestOSC>

    </div>);
  }
}

export default App;
