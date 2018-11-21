import React, {Component} from 'react';


class BusinessLogic {
  constructor() {
    this.resultdata = []
  }

  // How much should be recorded prior to the trigger
  preRecordSize = 20;
  // How much data should be recorded after the trigger
  recordSize = 120;

  // Return true if the system should start recording
  shouldRecordingStart(current_sample, history) {
    if(current_sample[1] >= 300) {
      return true;
    } else {
      return false;
    }
  }

  // Process the recorded data
  processRecordedData(data, xvalues, yvalues, zvalues) {
    var sumx = 0;
    var sumy = 0;
    var sumz = 0;

    // sum = sum + data[0][0];
    // sum = sum + data[1][0];
    // sum = sum + data[2][0];
    // sum = sum + data[3][0];
    // sum = sum + data[4][0];
    // sum = sum + data[5][0];

    for(var i=0;i<data.length;i=i+1) {
      sumx = sumx + Math.abs(data[i][0])
      sumy = sumy + Math.abs(data[i][1])
      sumz = sumz + Math.abs(data[i][2])
    }

    sumx = sumx / data.length
    sumy = sumy / data.length
    sumz = sumz / data.length

    var diff = (Math.max(...xvalues) - Math.min(...xvalues))

    this.resultdata.push(sumx)


    return {
      text: (
        <table>
          <tbody>
          <tr>
            <td>
              <h1>Twist</h1>
              <ul>
              <li>Average { sumx.toFixed(1) }</li>
              <li>Clockwise { Math.min(...xvalues).toFixed(1) }</li>
              <li>Counter { Math.max(...xvalues).toFixed(1) }</li>
              <li>Diff { (Math.max(...xvalues) - Math.min(...xvalues)).toFixed(1) }</li>
              </ul>
            </td>
            <td>
              <h1>Side-Side</h1>
              <ul>
              <li>Average { sumz.toFixed(1) }</li>
              <li>Left-Right { Math.min(...zvalues).toFixed(1) }</li>
              <li>Right-Left { Math.max(...zvalues).toFixed(1) }</li>
                <li>Diff { (Math.max(...zvalues) - Math.min(...zvalues)).toFixed(1) }</li>
              </ul>
            </td>
          </tr>
          </tbody>
        </table>

      ),
      graphdata : this.resultdata
    }
  }

}

export default BusinessLogic;
