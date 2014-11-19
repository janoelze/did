from Tkinter import *
import tkFont
import os
import json
import datetime
import time
import uuid

data_dir = '%s/data' % os.getcwd()

def load_data(file_path):
    try:
        with open(file_path, "r+") as f:
            return json.load(fp=f)
    except IOError:
            return []

def save_data(file_path, data):
	file = open(file_path, 'w+')
	file.write(json.dumps(data))
	file.close()

def create_record(description, time, length=60):
	today = datetime.date.today()
	record_file = '%s/%s-%s-%s.json' % (data_dir, today.strftime('%d'), today.strftime('%m'), today.strftime('%Y'))

	records = load_data(record_file)

	records.append({
		'id': str(uuid.uuid4()),
		'time': int(time),
		'description': str(description),
		'length': int(length)
	})

	save_data(record_file, records)

def main():
	root = Tk()

	root.attributes('-alpha', 0.85)

		# Create Input Box
	E1 = Entry(root, width=60)
	E1.pack()
	E1.focus()

	def submit(event):
		description = str(E1.get())
		if description is not '':
			def get_record_length(description):
				description = description.translate(None, '!@#$._-')
				description_tokens = description.split(' ')
				for token in description_tokens:
					# check if token consists of only addition signs
					if token == len(token) * '+':
						# calculate length, each addition sign symbolizes 10 minutes
						return len(token) * 10
				return 0

			length = get_record_length(description)

			create_record(description, time.time(), 60)
			load_records()

	root.bind("<Return>", submit)

	# Create Records List
	RecordsList = Listbox(root, font = tkFont.Font(family="Monaco", size=12), width=60)
	RecordsList.pack()

	def load_records():
		records = []
		RecordsList.delete(0, END)

		for subdir, dirs, files in os.walk(data_dir):
			for file in files:
				if file.endswith('.json'):
					json_data = open('%s/%s' % (data_dir, file), 'r+').read()
					data = json.loads(json_data)
					for record in data:
						records.append(record)

		records = sorted(records, key=lambda record: record['time'], reverse=True)

		for record in records:
			timestr = datetime.datetime.fromtimestamp(record['time']).strftime('%Y-%m-%d %H:%M:%S')
			description = record['description'].translate(None, '+')
			RecordsList.insert(END, "%s \t\t %s" % (timestr, description))

	load_records()

	root.update()

	screenWi = root.winfo_screenwidth() + 50
	screenHe = root.winfo_screenheight()
	guiWi = root.winfo_width()
	guiHe = root.winfo_height()
	x = screenWi / 2 - guiWi / 2
	y = screenHe / 2.5 - guiHe / 2

	root.geometry("%dx%d+%d+%d" % (guiWi, guiHe, x, y))

	os.system('''/usr/bin/osascript -e 'tell app "Finder" to set frontmost of process "Python" to true' ''')
	root.mainloop()

if __name__ == '__main__':
	main()
