var cheerio = require('cheerio'),
    request = require('request'),
    Sequelize = require('sequelize'),
    express = require('express');

var db = new Sequelize('offenders','root','root');

var app = express();

var Person = db.define('Person',{
  name: Sequelize.STRING,
  nid: Sequelize.STRING,
  dob: Sequelize.STRING,
  address: Sequelize.TEXT,
  sex: Sequelize.STRING,
  sentencePeriod: Sequelize.STRING,
  adjudicationDate: Sequelize.STRING,
  adjudicationEnforcementEnd: Sequelize.STRING,
  presentLocation: Sequelize.STRING,
  image: Sequelize.STRING,
  atoll: Sequelize.STRING,
  island: Sequelize.STRING
});

var Offence = db.define('Offence',{
  adjudicationDate: Sequelize.STRING,
  crimeDescription: Sequelize.STRING,
  adjudicationEndAndDuration: Sequelize.STRING,
  adjudication: Sequelize.STRING,
  appealed: Sequelize.STRING,
  status: Sequelize.STRING
});

Person.hasMany(Offence);

app.get("/",function(req,resp){
  
  Person.all().then(function(data){
    resp.send(data);
  });

});

app.get("/view/:id",function(req,resp){

  var id = req.params.id;

  Person.findOne({where: {id : id}, include: [Offence]}).then(function(person){

    resp.send(person);

  });

});

app.get('/crawl',function(freq,fresp){
  request('http://www.offenders.mv/offenders/',function(req,res,bdy){
    
    var $ = cheerio.load(bdy);

    var elements = $('.offender');
    var pagination = $('.post-pagination');
    var pages = $(pagination).find('a');

    elements.each(function(i, offender){
      var tables = $(offender).find('table');

      var columns = $(tables[0]).find('td');
      var columns2 = $(tables[1]).find('td');

      var name = $(columns[1]).text().replace(new RegExp(' ','g'),"-");
      var path = $(offender).find('img').attr('src').split('/');
      var filename = path[path.length-1].replace(name,"").split("-");

      var atollData = filename[1].split(".");

      Person.findOne({where : {nid: $(columns[3]).text().trim()}}).then(function(peep){

        if(!peep){

          var person = {
            name: $(columns[1]).text().trim(),
            nid: $(columns[3]).text().trim(),
            dob: $(columns[5]).text().trim(),
            address: $(columns[9]).text().trim(),
            sex: $(columns[11]).text().trim(),
            sentencePeriod: $(columns2[1]).text().trim(),
            adjudicationDate: $(columns2[3]).text().trim(),
            adjudicationEnforcementEnd: $(columns2[7]).text().trim(),
            presentLocation: $(columns2[9]).text().trim(),
            image: $(offender).find('img').attr('src'),
            atoll: atollData[0],
            island: atollData[1],
          };


          var detailUrl = $(offender).find('a').attr('href');

          request(detailUrl,(function(person){
            return function(req,resp,body){
            $ = cheerio.load(body);
            var data = $('.offences tr');

            //Person.create(person).then(function(p){
              var offences = [];
              data.each(function(j,row){

                if(j > 0){
                  var tds = $(row).find('td');
                  //console.log(tds);

                    var offence = {adjudicationDate: $(tds[0]).text(), crimeDescription: $(tds[1]).text(), adjudicationEndAndDuration: $(tds[2]).text(), adjudication: $(tds[3]).text(), appealed: $(tds[4]).text(), status: $(tds[5]).text()};
                    offences.push(offence);
                }
              });

              person.Offences = offences;

              Person.create(person,{ include: [Offence]});


              //p.setOffences(offences);

            //});

            }
          })(person));
      
        }
      //console.log(detailUrl);

      //console.log(person);
      });

    });

    pages.each(function(k,page){
      var pageUrl = $(page).attr('href');

      console.log(pageUrl);

      request(pageUrl,(function(pageUrl){
        return function(req,res,bdy){
        
        var $ = cheerio.load(bdy);

        var elements = $('.offender');

        elements.each(function(i, offender){
          var tables = $(offender).find('table');

          var columns = $(tables[0]).find('td');
          var columns2 = $(tables[1]).find('td');

          if($(offender).find('img').length > 0){

            var name = $(columns[1]).text().replace(new RegExp(' ','g'),"-");
            var path = $(offender).find('img').attr('src').split('/');
            var filename = path[path.length-1].replace(name,"").split("-");

            if(typeof filename != "undefined"){
            var atollData = filename[0].split(".");

            var atoll = atollData[0];
            var island = atollData[1];
            }
            else{
            var atoll = '';
            var island = '';
            }

          }
          else{
            var atoll = '';
            var island = '';
          }

          Person.findOne({where : {nid: $(columns[3]).text().trim()}}).then(function(peep){

            if(!peep){

              var person = {
                name: $(columns[1]).text().trim(),
                nid: $(columns[3]).text().trim(),
                dob: $(columns[5]).text().trim(),
                address: $(columns[9]).text().trim(),
                sex: $(columns[11]).text().trim(),
                sentencePeriod: $(columns2[1]).text().trim(),
                adjudicationDate: $(columns2[3]).text().trim(),
                adjudicationEnforcementEnd: $(columns2[7]).text().trim(),
                presentLocation: $(columns2[9]).text().trim(),
                image: $(offender).find('img').attr('src'),
                atoll: atoll,
                island:island
              };


              var detailUrl = $(offender).find('a').attr('href');

              request(detailUrl,(function(person){
                return function(req,resp,body){
                $ = cheerio.load(body);
                var data = $('.offences tr');

                //Person.create(person).then(function(p){
                  var offences = [];
                  data.each(function(j,row){

                    if(j > 0){
                      var tds = $(row).find('td');
                      //console.log(tds);

                        var offence = {adjudicationDate: $(tds[0]).text(), crimeDescription: $(tds[1]).text(), adjudicationEndAndDuration: $(tds[2]).text(), adjudication: $(tds[3]).text(), appealed: $(tds[4]).text(), status: $(tds[5]).text()};
                        offences.push(offence);
                    }
                  });

                  person.Offences = offences;

                  Person.create(person,{ include: [Offence]});


                  //p.setOffences(offences);

                //});

                }
              })(person));
          
            }
          //console.log(detailUrl);

          //console.log(person);
          });

        });

        }
      })(pageUrl));

    }); // iterate pages


  });

    fresp.send('OK');
});

db.sync().then(function(){
  app.listen(3001);

  console.log("Server Listening");
});
