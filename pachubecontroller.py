# Pachube Controller Dashboard
#
#**********************************************************************
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# ( at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# ERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
# Online: http://www.gnu.org/licenses/gpl.txt

# *****************************************************************

#This app is used for manipulating Pachube feeds through an interactive switch interface. 
#To get started create a feed at www.pachube.com and replace your feed id in the FEED variable
#and your api key in the API_KEY variable. In Pachube create your datastreams and give them
#initial values. 

#In the app, all datastream values that range from 0-1 will be rendered as digital switches and
#datastream max_value above 1 will be rendered as analog knobs. To control your datastreams
#simply execute this code, click on the switches or rotate the knobs to update pachube.

# João Wilbert / Connected Environments 2010
# *****************************************************************


import cgi
import os

from settings import *
from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import urlfetch
from django.utils import simplejson as json

global OWNS_FEED                                                                            
global API_KEY
global FEED
global USER_CONTROL
global PACHUBE_URL


class BasePage(webapp.RequestHandler):
    def write_page_header(self):
        path = os.path.join(os.path.dirname(__file__), 'templates')
        path = os.path.join(path, 'header.html')
        self.response.out.write(template.render(path, {}))   
        
    def write_page_footer(self):
        path = os.path.join(os.path.dirname(__file__), 'templates')
        path = os.path.join(path, 'footer.html')
        self.response.out.write(template.render(path, {}))      
                
class auth(BasePage):               
    def get(self):
        global USER_CONTROL
        global OWNS_FEED
        
        result = urlfetch.fetch(PACHUBE_URL+FEED+".json",headers={'X-PachubeApiKey': API_KEY })

        if result.status_code == 200: 
            objects = json.loads(result.content) 
            title = objects['title']
            
            body = "<eeml xmlns=\"http://www.eeml.org/xsd/005\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.eeml.org/xsd/005 http://www.eeml.org/xsd/005/005.xsd\"><environment><title>"+title+"</title></environment></eeml>"        	
       
            request = urlfetch.fetch(url=PACHUBE_URL+FEED+".xml", payload=str(body), method=urlfetch.PUT,headers={'X-PachubeApiKey': API_KEY })
            
            if request.status_code == 200:                
                OWNS_FEED = 1              
                self.redirect("/dashboard")
            else:
                OWNS_FEED = 0
                self.redirect("/dashboard")
            
        else:
            self.response.out.write(result.content)  

class loadDashboard(BasePage):    
    def get(self):
      self.write_page_header()
      self.loadFeedData()
      self.write_page_footer()
          
    def loadFeedData(self):
        
        try:
            OWNS_FEED
        except NameError:
            OWNS_FEED = 1
            
            if(OWNS_FEED == 1):
               user = USER_CONTROL
            else:
               user = ''        
        result = urlfetch.fetch(PACHUBE_URL+FEED+".json",headers={'X-PachubeApiKey': API_KEY })
        
        if result.status_code == 200:                         
               objects = json.loads(result.content)
               template_values = { 'objects' : objects }            
               
               if(objects.get('datastreams') == None):
                   initialDatastreams = 0
                   template_values = { 'objects' : objects, 'initialDatastreams' : initialDatastreams, 'user' : user, 'owns_feed' : OWNS_FEED }
               else:
                   initialDatastreams = len(objects['datastreams'])                                      
                   ids = []
                   for datastream in objects['datastreams']:
                       ids.append(datastream['id'])                       
                   self.loadGraphs(ids)

                   template_values = { 'objects' : objects, 'initialDatastreams' : initialDatastreams, 'user' : user, 'owns_feed' : OWNS_FEED   }
        else:
           template_values = {'status_code' : result.status_code, 'error' : result.content }
        
        path = os.path.join(os.path.dirname(__file__), 'templates')
        path = os.path.join(path, 'view.html')
        self.response.out.write(template.render(path, template_values))  
                       
    def loadGraphs(self,ids):
        graphs = []
    
        for datastream in ids: 
             
           retrieve = urlfetch.fetch(url="http://www.pachube.com/feeds/"+FEED+"/datastreams/"+str(datastream)+"/history.csv", method=urlfetch.GET,headers={'X-PachubeApiKey': API_KEY })
           graphs.append(retrieve.content)            
        
        if retrieve.status_code == 200:                        
            graph_values = { 'graphs' : graphs }
             
            path = os.path.join(os.path.dirname(__file__), 'templates')
            path = os.path.join(path, 'graphs.html')
            self.response.out.write(template.render(path, graph_values))              
        else:
           template_values = {'status_code' : result.status_code, 'error' : result.content  }


class updateStream(BasePage):
    def get(self,datastream,value):
        update = urlfetch.fetch(url=PACHUBE_URL+FEED+"/datastreams/"+datastream+".csv", payload=str(value), method=urlfetch.PUT,headers={'X-PachubeApiKey': API_KEY })        
        
        if update.status_code == 200:
          self.response.out.write(update.status_code)
          self.response.out.write(update.content)           
        else:
          self.response.out.write(update.status_code)
          self.response.out.write(update.content)           

 
class formDisplay(BasePage):
    def get(self,newDatastream):
        form_values = { 'newDatastream' : newDatastream }
        path = os.path.join(os.path.dirname(__file__), 'templates')
        path = os.path.join(path, 'form.html')
        self.response.out.write(template.render(path, form_values ))  


class formHandle(BasePage):   
   def post(self):    
        datastream = cgi.escape(self.request.get('datastream'))
        tag = cgi.escape(self.request.get('tag'))
        minValue = cgi.escape(self.request.get('minValue'))
        maxValue = cgi.escape(self.request.get('maxValue'))
        value = cgi.escape(self.request.get('value'))       
        
    	body = "<eeml xmlns=\"http://www.eeml.org/xsd/005\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.eeml.org/xsd/005 http://www.eeml.org/xsd/005/005.xsd\"><environment><data id=\""+str(datastream)+"\"><tag>"+tag+"</tag><value minValue=\""+str(minValue)+"\" maxValue=\""+str(maxValue)+"\">"+str(value)+"</value></data></environment></eeml>"        	
       
        create = urlfetch.fetch(url=PACHUBE_URL+FEED+"/datastreams/", payload=str(body), method=urlfetch.POST,headers={'X-PachubeApiKey': API_KEY })
                
        if create.status_code == 201:       
           self.redirect("/")
        else:
           self.redirect("/")
           self.response.out.write(create.status_code)
           
class loginDisplay(BasePage):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'templates')
        path = os.path.join(path, 'loginForm.html')
        self.response.out.write(template.render(path, {}))   
        
class loginHandle(BasePage):
    def post(self):
    
        global USER_CONTROL
        if cgi.escape(self.request.get('passphrase')) == PASSPHRASE:
            USER_CONTROL = 'user'          
            self.redirect("/dashboard")
        else:
            self.response.out.write("wrong password")

class logoutHandle(BasePage):
    def get(self): 
        global USER_CONTROL
        USER_CONTROL = ''
        self.redirect("/")      
        
class deleteStream(BasePage):
    def get(self,datastream):
       create = urlfetch.fetch(url=PACHUBE_URL+FEED+"/datastreams/"+datastream, method=urlfetch.DELETE,headers={'X-PachubeApiKey': API_KEY })   
       if create.status_code == 200:
           self.redirect("/")
       else:
           print create.status_code

  
application = webapp.WSGIApplication(
                                     [('/', auth),
                                     ('/loginDisplay', loginDisplay),
                                     ('/login', loginHandle),
                                     ('/logout', logoutHandle),
                                     ('/dashboard', loadDashboard),
                                     ('/formDisplay/(.*)', formDisplay),
                                     ('/formHandle', formHandle),                            
                                     ('/delete/(.*)', deleteStream),
                                     ('/update/(.*)/(.*)', updateStream)], 
                                     debug=True)

def main():
    run_wsgi_app(application)


if __name__ == "__main__":
    main()
