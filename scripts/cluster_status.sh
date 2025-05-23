#!/bin/bash


#Color Variables
red=$(tput setaf 1)
bold=$(tput bold)
reset=$(tput sgr0)


#Cell Variables
getOS=$(cat /etc/system-release)  
getUptime=$(uptime | awk {'print $3 " " $4'} |cut -d, -f1) # awk output: 5 days,  cut output: 5 days
getUptimeNum=$(uptime | awk {'print $3'}) # awk output: 5
cellName=$(ls -l /opt/was_static/profiles/appsrv01/config/cells  | grep "^d"  | awk '{print $NF}')  # output: hollmieaodr10Cell01
cellMembers=$(ls /opt/websphere/appserver/profiles/appsrv01/config/cells/${cellName}/nodes | grep -v dmgr| sed 's/^/*/')
getMillDomains=$([ -d /usr/local/bin/cerner_dm ] && ls /usr/local/bin/cerner_dm/ | sort | sed 's/^/*/') # fetches all the domains and sorts them 
getODRconsole=$(grep -i hostname /opt/was_static/profiles/appsrv01/config/cells/${cellName}/nodes/dmgr/serverindex.xml | sed 's/^.*hostName/hostName/' | cut -f1,2 -d'"' | cut -d '"' -f2- | cut -d '.' -f1)
menuscript=$(find /home -iname menuscript.sh)


echo "****************************** EAWAS Cell Information ******************************"
echo "*${bold}OS:${reset} ${getOS}                                                        "
echo "*${bold}Uptime:${reset} ${getUptime}                                                "
echo "*${bold}Cell Management:${reset} ${menuscript}                                      "
echo "*${bold}Console:${reset} https://${getODRconsole}:9043/ibm/console                  "
echo "*${bold}Domains:${reset}                                                            "
echo "${getMillDomains}                                                                   "
echo "*${bold}Cell Members:${reset}                                                       "
echo "${cellMembers}                                                                      "
echo "*                                                                                   "
echo "************************************************************************************"

#################################################################################################################################################################
echo ""
echo ""
echo ""
/home/wasadmin/menu_config/was_status.sh

echo "****************************************************************************************************************"

echo "****************************** Cluster status for the given domain ******************************"
dmgr_profile=dmgr
app_profile=appsrv01
host=$(hostname -s)
static=/opt/was_static
profile_root="$static"/profiles
servers_dir="${profile_root}/${app_profile}/servers"
date_var=$(date +"%b-%d-%y")
logfile="$static/logs/$scriptName-$date_var.log"
was_home=/opt/websphere
was_profile="$was_home"/appserver/profiles
cell=$(ls "$was_profile"/appsrv01/config/cells | grep "Cell")
nodes="$(ls $was_profile/appsrv01/config/cells/$cell/nodes | grep -vw dmgr)"
nodearray=($nodes)
servers="$nodes"
clusterdir=$was_profile/$app_profile/config/cells/"$cell"/dynamicclusters
clusters=$(ls $clusterdir)
clusterAry=($clusters)
clusters+=" Back"
clusters+=" Quit"
check="yes"
domain="t316"
domainclusters="$(ls $was_profile/$app_profile/config/cells/"$cell"/dynamicclusters | grep "_${domain}$")"
cluster_domain_array=($domainclusters)
wasnodexml="$was_profile/$app_profile/config/cells/"$cell"/nodegroups/WVENodeGroup/nodegroup.xml"
wasNodes=$(echo 'cat //members/@nodeName' | xmllint --shell $wasnodexml)
wasNodes=$(echo $wasNodes | tr -d '-' | tr -d '/' | tr -d '>')
wasNodesAry=($wasNodes)
w=0
for wn in ${wasNodesAry[@]}; do
	wasNodesAry[$w]=$(echo $wn | cut -d '"' -f2)
	let w++
done

mkdir -p "$static/logs"
touch "$logfile"
chown wasadmin:wasadmin "$logfile"

GREEN='\E[40;32m'
RED='\E[40;31m'
STARTCOLOR='\033[1m'
ENDCOLOR='\033[0m'

while [[ "$check" == "yes" ]]; do
	for clu in ${cluster_domain_array[@]}; do
		dynClusterXML=($(cat "$was_profile""/appsrv01/config/cells/"$cell"/dynamicclusters/"$clu"/dynamiccluster.xml"))
		for i in ${dynClusterXML[@]}; do
			if [[ "$i" == *"minInstances"* ]]; then
				minInstances="$i"
			fi
			if [[ "$i" == *"maxInstances"* ]]; then
				maxInstances="$i"
			fi
			if [[ "$i" == *"operationalMode"* ]]; then
				operationalMode="$i"
				# Creates variable for cluster operational mode
				# EX: core_securityservice_b0000operationalMode | manual
				eval "$clu$i"
			fi 
		done
		
		if [[ "$operationalMode" == *"manual"* ]]; then
			echo -e "$clu |$RED$STARTCOLOR $operationalMode $ENDCOLOR| $maxInstances | $minInstances"
			#echo ""

		else
			echo -e "$clu |$GREEN$STARTCOLOR $operationalMode $ENDCOLOR| $maxInstances | $minInstances"
			#echo ""
		fi
        clusterJvms=()
	    for i in "${nodearray[@]}"; do
		   # echo "DEBUG: connecting to node $i to check status of $cluster"
		   ssh $i /home/wasadmin/menu_config/cluster_status.sh "$clu"
		   #clusterJvms+=($(ssh $i ls $servers_dir | grep "${clu}_${i}" ))
	    done
	    #echo "$clusterJvms"
	done
check="no"
done

echo "****************************************************************************************************************"