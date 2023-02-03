from bs4 import BeautifulSoup
import requests
from collections import defaultdict

source = requests.get('https://www.servicecenter.ovgu.de/').text
soup = BeautifulSoup(source, 'lxml')

import pyrebase

firebaseConfig = {
    "apiKey": "AIzaSyAuL9FgcYyC8bhWPEvyk-Kub5XvB1ban-M",
    "authDomain": "digengproject02.firebaseapp.com",
    "databaseURL": "https://digengproject02-default-rtdb.firebaseio.com",
    "projectId": "digengproject02",
    "storageBucket": "digengproject02.appspot.com",
    "messagingSenderId": "823072307560",
    "appId": "1:823072307560:web:0cb48072250a7737a3bedd",
    "measurementId": "G-8S199MQ85C"
}

firebase = pyrebase.initialize_app(firebaseConfig)
db = firebase.database()

######## parameters #########


current_day = ""
######### functions #########

def set_opening_time(opening_hours_code):
    global current_day
    if "Mo" in opening_hours_code:
        current_day = "1"
    elif "Di" in opening_hours_code:
        current_day = "2"
    elif "Mi" in opening_hours_code:
        current_day = "3"
    elif "Do" in opening_hours_code:
        current_day = "4"
    elif "Fr" in opening_hours_code:
        current_day = "5"
    else:

        if opening_hours_code.startswith("|"):
            opening_hours_code=opening_hours_code[2:]
        if opening_hours_code.startswith("0") or opening_hours_code.startswith("1"):
            return opening_hours_code
        else:
            pass

#############################


 ##### Webscraper #####
def webscrape_opening_hours():
    for block in soup.find_all('div', class_='ubox ubox75 ubox75_width1'):
        department_database = defaultdict(list)
        opening_hours_database = defaultdict(list)

        department = block.find("a")["title"]
        if department == "Infotheke":
            department = "campus service center"
        elif department == "Studierendensekretariat":
            department = "students office"
        elif department == "Prüfungen":
            department = "exam office"
        print(department)

        hours_block = block.find("div", class_="ubox_kurzinfo")
        for td in hours_block.find_all("td"):
            opening_hours_code = td.text
            hours = set_opening_time(opening_hours_code)
            if hours is not None:
                opening_hours_database[current_day].append(hours)

        department_database[department].append(opening_hours_database)
        database = (dict(opening_hours_database))
        print (database)
        for keys, values in database.items():
            print(keys)
            values = str(values)
            values = values.replace("Uhr", "")
            values = values.replace("'","")
            values = values.replace("[","")
            values = values.replace("]","")
            values = values.replace(" ","")
            print(values)
            db.child("Office hours_2").child(department).update({keys:values})


def webscrape_employees():
    source = requests.get('https://www.ovgu.de/studentensekretariat.html').text
    soup = BeautifulSoup(source, 'lxml')

    area = []
    iter = 0

    task_table = soup.find("section", id="content")
    for task in task_table.find_all("h5"):
        task = task.text
        area.append(task)
        #print(task)
    #print(area)

    for employee_table in soup.find_all("table", style="width: 100%;"):


        for employee in employee_table.find_all("td"):
            info = employee.text
            #print(info)

            #print(info.split("|"))
            name = info.split("|")[0]
            room = info.split("|")[1]
            telephone = info.split("|")[2]
            email = name.replace("\xa0", "").split(" ")
            #print(email)
            email = (email[0] + "." + email[1] + "@ovgu.de").lower().replace(" ","")
            if len(name) > 5:
                db.child("Employees_2").child(area[iter].replace("%20","")).child(name).set({"name": name})
                db.child("Employees_2").child(area[iter].replace("%20","")).child(name).update({"room": room})
                db.child("Employees_2").child(area[iter].replace("%20","")).child(name).update({"telephone": telephone})
                db.child("Employees_2").child(area[iter].replace("%20","")).child(name).update({"email": email})
                db.child("Employees_2").child(area[iter].replace("%20","")).child(name).update({"expertise": area[iter].replace("%20","")})
        iter += 1

###############

if __name__ == '__main__':
    webscrape_opening_hours()
    webscrape_employees()
    print("Success")
