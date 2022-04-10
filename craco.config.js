const CracoAntDesignPlugin = require("craco-antd");
const webpack=require('webpack')
global.__DEV__=process.env.NODE_ENV==="development"
module.exports={
   babel:{
    "plugins": [
      ["@babel/plugin-proposal-logical-assignment-operators"],
      ["@babel/plugin-proposal-nullish-coalescing-operator"]
    ]
   },
   webpack:{
      plugins:{
        add:[new webpack.DefinePlugin({
           __DEV__:JSON.stringify(process.env.NODE_ENV==="development")
        })]
      }
   },
    plugins: [
      {
        plugin: CracoAntDesignPlugin,
        options: {
          customizeTheme: {
            "@primary-color": "#d81e06",
            "@border-radius-base":"4px",
            "@body-background":'#f2f2f2'
          },
        },
      },
     
       {
        plugin: {overrideWebpackConfig:({webpackConfig})=>{
          
          return webpackConfig},
         
         }
      } 
    ],
  }